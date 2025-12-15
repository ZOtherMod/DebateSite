import styles from './css/End.module.css';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function End() {
    const navigate = useNavigate();
    const [finalData, setFinalData] = useState(null);
    
    useEffect(() => {
        const data = localStorage.getItem('finalDebateData');
        if (data) {
            setFinalData(JSON.parse(data));
        } else {
            // No final data, redirect to home
            navigate('/');
        }
    }, [navigate]);

    const downloadDebateLog = () => {
        if (!finalData) return;
        
        let content = `Debate Log\n`;
        content += `Topic: ${finalData.topic}\n`;
        content += `Date: ${new Date().toLocaleDateString()}\n\n`;
        
        if (finalData.final_log) {
            finalData.final_log.forEach(message => {
                const time = new Date(message.timestamp).toLocaleTimeString();
                content += `[${time}] ${message.sender_username} (Turn ${message.turn_number}):\n`;
                content += `${message.content}\n\n`;
            });
        }
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debate-log-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const startNewDebate = () => {
        localStorage.removeItem('finalDebateData');
        localStorage.removeItem('currentDebate');
        navigate('/start');
    };

    const goHome = () => {
        localStorage.removeItem('finalDebateData');
        localStorage.removeItem('currentDebate');
        navigate('/');
    };

    if (!finalData) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.endContainer}>
                    <div className={styles.endHeader}>
                        <h2>Debate Finished</h2>
                        <p className={styles.endMessage}>
                            Thank you for participating in this debate session!
                        </p>
                    </div>
                    
                    {/* Topic Section */}
                    <div className={styles.topicSection}>
                        <h3>Debate Topic</h3>
                        <div className={styles.topicText}>
                            {finalData.topic}
                        </div>
                    </div>
                    
                    {/* Debate Log */}
                    <div className={styles.finalLogSection}>
                        <h3>Final Debate Log</h3>
                        <div className={styles.finalDebateLog}>
                            {finalData.final_log?.map((message, index) => {
                                const time = new Date(message.timestamp).toLocaleTimeString();
                                return (
                                    <div key={index} className={`${styles.logMessage} ${message.sender_id ? styles.user : styles.system}`}>
                                        <div className={styles.messageHeader}>
                                            <span>{message.sender_username} {message.turn_number && `(Turn ${message.turn_number})`}</span>
                                            <span className={styles.messageTimestamp}>{time}</span>
                                        </div>
                                        <div className={styles.messageContent}>{message.content}</div>
                                    </div>
                                );
                            }) || <p>No messages recorded.</p>}
                        </div>
                    </div>
                    
                    {/* Actions */}
                    <div className={styles.endActions}>
                        <button 
                            className={styles.primaryButton}
                            onClick={downloadDebateLog}
                        >
                            Download Log
                        </button>
                        <button 
                            className={styles.secondaryButton}
                            onClick={startNewDebate}
                        >
                            New Debate
                        </button>
                        <button 
                            className={styles.secondaryButton}
                            onClick={goHome}
                        >
                            Home
                        </button>
                    </div>
                    
                    {/* Feedback */}
                    <div className={styles.feedbackSection}>
                        <h3>Experience Complete</h3>
                        <p className={styles.feedbackText}>
                            Both participants have gained valuable debate experience. 
                            Continue practicing to improve your argumentation skills!
                        </p>
                        <div className={styles.feedbackNote}>
                            <em>No scoring or judging is performed - both participants gain equal experience.</em>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default End;
