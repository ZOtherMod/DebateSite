import styles from './css/About.module.css';
import { useState } from "react";

function About() {
  const [open1, setOpen1] = useState(false);

  return (
    <main className={styles.aboutPage}>
      <div className={styles.aboutContainer}>
        <h1 className={styles.aboutTitle}>About DebatePlatform</h1>

        <div className={styles.aboutBox}>
          <button className={styles.aboutDropdownHeader} onClick={() => setOpen1(!open1)}>
            <h2 className={styles.aboutSubheading}>What is DebatePlatform?</h2>
          </button>

          {open1 && (
            <p className={styles.aboutText}>
              DebatePlatform is an online matchmaking platform that pairs users to debate a wide range of 
              topics in real-time. Each debate follows structured rules and timing to ensure fair and 
              productive discussions.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default About;
