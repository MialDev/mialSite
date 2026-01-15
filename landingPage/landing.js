
document.addEventListener('DOMContentLoaded', () => {
    // Tracking Init
    console.log("Landing Page Loaded");
    
    // Modal Logic
    const modal = document.getElementById('lead-modal');
    const openBtns = document.querySelectorAll('.open-modal-btn');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('lead-form');
    const successMsg = document.getElementById('success-message');
    const formContainer = document.getElementById('form-container');

    function openModal() {
        modal.classList.add('active');
        // Simple event tracking
        if(window.gtag) window.gtag('event', 'lp_open_modal');
        console.log("Event: lp_open_modal");
    }

    function closeModal() {
        modal.classList.remove('active');
    }

    openBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    }));

    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "Envoi...";

        const formData = new FormData(form);
        const payload = {
            email: formData.get('email'),
            first_name: formData.get('first_name'),
            phone: formData.get('phone'), // Optional
            profile_type: formData.get('profile_type'), 
            message: formData.get('message'),
            source: document.body.dataset.source || 'landing_generic',
            user_agent: navigator.userAgent
        };

        try {
            // API CALL
            // Utilisation de l'URL absolue ou relative selon le déploiement.
            // On suppose que portal-api est servi sur le même domaine via proxy ou directement.
            // Si dev local: http://localhost:8000/public/lead
            // Mais l'user a demandé un code générique.
            
            // Tentative detection API
            const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'http://localhost:8000' 
                : ''; // Relative path on production if same domain
            
            const endpoint = `${API_BASE}/public/lead`;
            
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Success UI
                formContainer.style.display = 'none';
                successMsg.style.display = 'block';
                
                // Track
                if(window.gtag) window.gtag('event', 'lp_submit_form');
                console.log("Event: lp_submit_form");
                
            } else {
                alert("Une erreur est survenue. Veuillez réessayer.");
                btn.disabled = false;
                btn.innerText = originalText;
            }

        } catch (err) {
            console.error(err);
            // Fallback LocalStorage si API fail (pour ne pas perdre le lead en dev)
            const leads = JSON.parse(localStorage.getItem('mial_leads_backup') || '[]');
            leads.push({...payload, date: new Date().toISOString()});
            localStorage.setItem('mial_leads_backup', JSON.stringify(leads));
            
            // Show success anyway to user
            formContainer.style.display = 'none';
            successMsg.style.display = 'block';
        }
    });
});
