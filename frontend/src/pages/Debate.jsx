import styles from './css/Debate.module.css';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

function Debate() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [currentDebate, setCurrentDebate] = useState(null);
    const [debatePhase, setDebatePhase] = useState('Loading');
    const [yourSide, setYourSide] = useState('');
    const [opponentSide, setOpponentSide] = useState('');
    const [timerDisplay, setTimerDisplay] = useState('00:00');
    const [timerLabel, setTimerLabel] = useState('Loading');
    const [turnStatus, setTurnStatus] = useState('Loading debate...');
    const [isYourTurn, setIsYourTurn] = useState(false);
    const [messages, setMessages] = useState([]);
    const [argumentInput, setArgumentInput] = useState('');
    const [error, setError] = useState('');

    const messagesEndRef = useRef(null);
    const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

    // Check if user has debate data
    useEffect(() => {
        const userData = localStorage.getItem('debateUser');
        const debateData = localStorage.getItem('currentDebate');
        
        if (!userData || !debateData) {
            navigate('/matchmaking');
            return;
        }
        
        setCurrentUser(JSON.parse(userData));
        setCurrentDebate(JSON.parse(debateData));
        
        // Start the debate session
        setTimeout(() => {
            if (connectionStatus === 'Connected') {
                const user = JSON.parse(userData);
                const debate = JSON.parse(debateData);
                sendMessage({
                    type: 'start_debate',
                    user_id: user.id,
                    debate_id: debate.id
                });
            }
        }, 1000);
    }, [navigate, connectionStatus, sendMessage]);

    // Handle WebSocket messages
    useEffect(() => {
        if (lastMessage) {
            try {
                const data = JSON.parse(lastMessage.data);
                
                switch (data.type) {
                    case 'start_debate_response':
                        if (!data.success) {
                            setError(`Failed to start debate: ${data.error}`);
                        }
                        break;
                    case 'debate_started':
                        setDebatePhase('Preparation');
                        setYourSide(data.your_side);
                        setOpponentSide(data.opponent_side);
                        addSystemMessage(`Debate started! You are arguing for the ${data.your_side}. Preparation time begins now.`);
                        break;
                    case 'prep_timer_start':
                        setTimerLabel('Preparation Time');
                        setTurnStatus('Preparation phase - get ready for the debate!');
                        break;
                    case 'prep_timer':
                        setTimerDisplay(data.display);
                        break;
                    case 'debate_phase_start':
                        setDebatePhase('Debate');
                        addSystemMessage('Preparation time is over. The debate begins!');
                        break;
                    case 'your_turn':
                        setIsYourTurn(true);
                        const sideInfo = data.your_side ? ` (${data.your_side})` : '';
                        setTimerLabel(`Your Turn (${data.turn_number})${sideInfo}`);
                        setTurnStatus(`It's your turn! Present your ${data.your_side || 'argument'}.`);
                        break;
                    case 'opponent_turn':
                        setIsYourTurn(false);
                        const opponentSideInfo = data.opponent_side ? ` (${data.opponent_side})` : '';
                        setTimerLabel(`Opponent's Turn (${data.turn_number})${opponentSideInfo}`);
                        setTurnStatus(`Waiting for opponent's ${data.opponent_side || 'argument'}...`);
                        break;
                    case 'turn_timer':
                        setTimerDisplay(data.display);
                        break;
                    case 'message':
                        addDebateMessage(
                            data.sender_username,
                            data.content,
                            data.sender_id === currentUser?.id ? 'user' : 'opponent',
                            data.timestamp,
                            data.turn_number
                        );
                        break;
                    case 'debate_ended':
                        setDebatePhase('Finished');
                        addSystemMessage('Debate has ended!');
                        localStorage.setItem('finalDebateData', JSON.stringify(data));
                        setTimeout(() => navigate('/end'), 2000);
                        break;
                    case 'error':
                        setError(data.message);
                        break;
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        }
    }, [lastMessage, currentUser, navigate]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const addSystemMessage = (content) => {
        setMessages(prev => [...prev, {
            type: 'system',
            content,
            timestamp: new Date().toISOString()
        }]);
    };

    const addDebateMessage = (sender, content, type, timestamp, turnNumber) => {
        setMessages(prev => [...prev, {
            type,
            sender,
            content,
            timestamp,
            turnNumber
        }]);
    };

    const submitArgument = () => {
        if (!argumentInput.trim()) {
            setError('Please enter an argument');
            return;
        }

        if (argumentInput.length > 1000) {
            setError('Argument too long (max 1000 characters)');
            return;
        }

        sendMessage({
            type: 'debate_message',
            user_id: currentUser.id,
            content: argumentInput.trim()
        });

        setArgumentInput('');
        setError('');
    };

    const clearArgument = () => {
        setArgumentInput('');
    };

    const formatMessage = (msg) => {
        const time = new Date(msg.timestamp).toLocaleTimeString();
        
        if (msg.type === 'system') {
            return (
                <div key={msg.timestamp} className={`${styles.logMessage} ${styles.system}`}>
                    <div className={styles.messageContent}>{msg.content}</div>
                </div>
            );
        }
        
        return (
            <div key={msg.timestamp} className={`${styles.logMessage} ${styles[msg.type]}`}>
                <div className={styles.messageHeader}>
                    <span>{msg.sender} {msg.turnNumber && `(Turn ${msg.turnNumber})`}</span>
                    <span className={styles.messageTimestamp}>{time}</span>
                </div>
                <div className={styles.messageContent}>{msg.content}</div>
            </div>
        );
    };

    if (!currentUser || !currentDebate) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.debateContainer}>
                    {/* Topic Section */}
                    <div className={styles.topicSection}>
                        <h2>Debate Topic</h2>
                        <div className={styles.topicText}>
                            {currentDebate.topic}
                        </div>
                    </div>
                    
                    {/* Timer Section */}
                    <div className={styles.timerSection}>
                        <div className={styles.timerContainer}>
                            <div className={styles.timerLabel}>{timerLabel}</div>
                            <div className={styles.timerDisplay}>{timerDisplay}</div>
                            <div className={styles.timerProgress}>
                                <div className={styles.timerBar}></div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Opponent Info */}
                    <div className={styles.opponentSection}>
                        <h3>Opponent</h3>
                        <div className={styles.opponentInfo}>
                            <span>{currentDebate.opponent.username}</span>
                            <span className={styles.mmr}>MMR: {currentDebate.opponent.mmr}</span>
                        </div>
                    </div>
                    
                    {/* Side Assignment */}
                    {(yourSide || opponentSide) && (
                        <div className={styles.sidesSection}>
                            <h3>Debate Positions</h3>
                            <div className={styles.sidesInfo}>
                                <div className={styles.sideItem}>
                                    <span className={styles.sideLabel}>Your Side:</span>
                                    <span className={styles.sideValue}>{yourSide}</span>
                                </div>
                                <div className={styles.sideItem}>
                                    <span className={styles.sideLabel}>Opponent Side:</span>
                                    <span className={styles.sideValue}>{opponentSide}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Debate Log */}
                    <div className={styles.debateLogSection}>
                        <h3>Debate Log</h3>
                        <div className={styles.debateLog}>
                            {messages.map(formatMessage)}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                    
                    {/* Input Section */}
                    <div className={styles.inputSection}>
                        <div className={styles.turnStatus}>
                            {turnStatus}
                        </div>
                        
                        {isYourTurn ? (
                            <div className={styles.argumentInputContainer}>
                                <div className={styles.inputHeader}>
                                    <span>Your Argument</span>
                                    <span className={styles.characterCount}>
                                        {argumentInput.length}/1000
                                    </span>
                                </div>
                                
                                <textarea
                                    value={argumentInput}
                                    onChange={(e) => setArgumentInput(e.target.value)}
                                    placeholder="Enter your argument here..."
                                    maxLength={1000}
                                    rows={4}
                                    className={styles.argumentTextarea}
                                />
                                
                                {error && (
                                    <div className={styles.error}>{error}</div>
                                )}
                                
                                <div className={styles.inputControls}>
                                    <button 
                                        onClick={clearArgument}
                                        className={styles.secondaryButton}
                                    >
                                        Clear
                                    </button>
                                    <button 
                                        onClick={submitArgument}
                                        className={styles.primaryButton}
                                        disabled={!argumentInput.trim()}
                                    >
                                        Submit Argument
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.waitingMessage}>
                                Waiting for your turn...
                            </div>
                        )}
                    </div>
                    
                    {/* Connection Status */}
                    <div className={styles.connectionStatus}>
                        <span className={`${styles.statusIndicator} ${connectionStatus === 'Connected' ? styles.online : styles.offline}`}>
                            ●
                        </span>
                        <span>{connectionStatus}</span>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Debate;
