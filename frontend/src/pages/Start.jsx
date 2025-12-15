import styles from './css/Start.module.css';
import { useState } from "react";
import { useNavigate } from 'react-router-dom';

function Start() {
  const navigate = useNavigate();
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <main className={styles.Start}>
      {rulesOpen && (
        <div className={styles.popupModal}>
          <div className={styles.popupContent}>
            <h2 className={styles.popupTitle}>Debate Rules</h2>
            <ol> 
              <li>No plagiarism — quotes allowed but must be credited.</li>
              <li>No personal attacks or hate speech toward any participant or group.</li>
              <li>Stay on topic and argue the ideas, not the person.</li>
              <li>No threats, harassment, or sharing personal information.</li>
              <li>No spam, trolling, or attempts to disrupt the platform.</li>
              <li>Follow moderator instructions — violations may result in removal.</li>
            </ol>
            <button className={styles.popupButton} onClick={() => setRulesOpen(false)}>Close</button>
          </div>
        </div>
      )}

      <div className={styles.mainLeft}>
        <h1 className={styles.mainText}>Ready to Debate?</h1>
        <h2 className={styles.mainSubtext}>
          Rise up. Persuade. Shape the outcome.
        </h2>
      </div>

      <div className={styles.mainRight}>
        <div className={styles.buttonWrapper}> 
          <button className={styles.joinButton} onClick={() => navigate('/matchmaking')}>
            Join Matchmaking
          </button>

          <div className={styles.bottomActions}>
            <button
              className={styles.rulesButton}
              onClick={() => setRulesOpen(true)}>
              View Rules
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Start;
