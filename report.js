// report.js — PDF export via browser print
// Strategy: hide everything except the relevant output panel, trigger window.print(),
// then restore. The @media print rules in styles.css handle layout.

window.BR_REPORT = (function () {

  function printOutput(panelSelector, outputId) {
    // The CSS already handles hiding non-relevant elements via .no-print.
    // We just need to ensure ONLY the right tab + the right mode is visible.

    // Snapshot which tab is active
    const personasTab = document.getElementById('tab-personas');
    const trendsTab = document.getElementById('tab-trends');
    const researchTab = document.getElementById('tab-research');

    const wasActive = {
      personas: personasTab.classList.contains('active'),
      trends: trendsTab.classList.contains('active'),
      research: researchTab.classList.contains('active'),
    };

    // Force research tab active
    personasTab.classList.remove('active');
    trendsTab.classList.remove('active');
    researchTab.classList.add('active');

    // Trigger print
    setTimeout(() => {
      window.print();
      // Restore previous active state
      if (wasActive.personas) { personasTab.classList.add('active'); researchTab.classList.remove('active'); }
      else if (wasActive.trends) { trendsTab.classList.add('active'); researchTab.classList.remove('active'); }
      // (else research was already active)
    }, 50);
  }

  function printSingle(result) {
    // Output is already rendered in #single-output. Just need to ensure single mode is visible.
    document.querySelectorAll('.research-mode').forEach(m => m.classList.remove('active'));
    document.getElementById('research-single').classList.add('active');
    printOutput('#research-single', 'single-output');
  }

  function printSurvey(result) {
    document.querySelectorAll('.research-mode').forEach(m => m.classList.remove('active'));
    document.getElementById('research-survey').classList.add('active');
    printOutput('#research-survey', 'survey-output');
  }

  return { printSingle, printSurvey };
})();
