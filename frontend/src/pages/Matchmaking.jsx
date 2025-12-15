import styles from './css/Matchmaking.module.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';

function Matchmaking() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);
    const [isInQueue, setIsInQueue] = useState(false);
    const [queueStatus, setQueueStatus] = useState('');
    const [matchFound, setMatchFound] = useState(null);
    const [error, setError] = useState('');

    const { sendMessage, lastMessage, connectionStatus } = useWebSocket();

    // Check if user is logged in
    useEffect(() => {
        const userData = localStorage.getItem('debateUser');
        if (!userData) {
            navigate('/login');
            return;
        }
        setCurrentUser(JSON.parse(userData));
    }, [navigate]);

    // Handle WebSocket messages
    useEffect(() => {
        if (lastMessage) {
            try {
                const data = JSON.parse(lastMessage.data);
                
                switch (data.type) {
                    case 'queue_joined':
                        setIsInQueue(true);
                        setQueueStatus(`Players in queue: ${data.queue_status?.queue_size || 0}`);
                        break;
                    case 'queue_left':
                        setIsInQueue(false);
                        setQueueStatus('');
                        break;
                    case 'match_found':
                        setMatchFound({
                            debate_id: data.debate_id,
                            topic: data.topic,
                            opponent: data.opponent
                        });
                        localStorage.setItem('currentDebate', JSON.stringify({
                            id: data.debate_id,
                            topic: data.topic,
                            opponent: data.opponent
                        }));
                        break;
                    case 'error':
                        setError(data.message);
                        setIsInQueue(false);
                        break;
                }
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        }
    }, [lastMessage]);

    const startMatchmaking = () => {
        if (connectionStatus !== 'Connected' || !currentUser) {
            setError('Not connected to server or not logged in');
            return;
        }
        
        sendMessage({
            type: 'join_matchmaking',
            user_id: currentUser.id
        });
        setError('');
    };

    const stopMatchmaking = () => {
        sendMessage({
            type: 'leave_matchmaking',
            user_id: currentUser.id
        });
    };

    const proceedToDebate = () => {
        navigate('/debate');
    };

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.matchmakingContainer}>
                    <div className={styles.matchmakingSection}>
                        <h2>Find a Debate</h2>
                        <p className={styles.description}>
                            Join the matchmaking queue to find an opponent with similar skill level.
                        </p>
                        
                        {currentUser && (
                            <div className={styles.userInfo}>
                                <p><strong>Username:</strong> {currentUser.username}</p>
                                <p><strong>MMR:</strong> {currentUser.mmr}</p>
                            </div>
                        )}

                        {connectionStatus !== 'Connected' && (
                            <div className={styles.connectionError}>
                                Connection Status: {connectionStatus}
                            </div>
                        )}

                        {error && (
                            <div className={styles.error}>{error}</div>
                        )}

                        <div className={styles.controls}>
                            {!isInQueue ? (
                                <button 
                                    className={styles.primaryButton}
                                    onClick={startMatchmaking}
                                    disabled={connectionStatus !== 'Connected'}
                                >
                                    Start Matchmaking
                                </button>
                            ) : (
                                <button 
                                    className={styles.dangerButton}
                                    onClick={stopMatchmaking}
                                >
                                    Stop Matchmaking
                                </button>
                            )}
                        </div>
                        
                        {isInQueue && (
                            <div className={styles.statusContainer}>
                                <div className={styles.statusText}>
                                    Searching for opponent...
                                </div>
                                {queueStatus && (
                                    <div className={styles.queueStatus}>{queueStatus}</div>
                                )}
                                <div className={styles.loadingDots}>
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}

                        {matchFound && (
                            <div className={styles.matchFoundContainer}>
                                <h3>Match Found!</h3>
                                <div className={styles.opponentInfo}>
                                    <h4>Your Opponent:</h4>
                                    <p><strong>{matchFound.opponent.username}</strong></p>
                                    <p>MMR: {matchFound.opponent.mmr}</p>
                                </div>
                                <div className={styles.topicInfo}>
                                    <h4>Debate Topic:</h4>
                                    <p className={styles.debateTopic}>{matchFound.topic}</p>
                                </div>
                                <button 
                                    className={styles.primaryButton}
                                    onClick={proceedToDebate}
                                >
                                    Proceed to Debate
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.infoSection}>
                        <h3>How It Works</h3>
                        <ul>
                            <li>Click "Start Matchmaking" to join the queue</li>
                            <li>You'll be matched with someone of similar skill level</li>
                            <li>Each debate has a preparation phase followed by timed arguments</li>
                            <li>Stay respectful and argue the topic, not the person</li>
                        </ul>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Matchmaking;
