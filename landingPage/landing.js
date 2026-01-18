
document.addEventListener('DOMContentLoaded', () => {

    const PHONE_DEMOS = {
        landing_resume: {
            title: "Smart Récap", // or hidden
            mails: [
                {
                    type: "action",
                    title: "Infos manquantes",
                    from: "Marc",
                    body: "Peux-tu remplir le document demandé avant demain.",
                    tag: "🔥 ACTION"
                },
                {
                    type: "meeting",
                    title: "Réunion comptable",
                    from: "Sophie",
                    body: "Peux-tu proposer un créneau de 15 minutes pour la réunion avec le comptable.",
                    tag: "📅 MEETING"
                },
                {
                    type: "info",
                    title: "Absence fin de semaine",
                    from: "Cathy",
                    body: "Je ne serai pas là en fin de semaine.",
                    tag: "ℹ️ INFO"
                },
                {
                    type: "pub",
                    title: "Tester MIAL Vocal",
                    from: "MIAL",
                    body: "Teste Mial vocal gratuitement.",
                    tag: "🏷️ PUB"
                }
            ],
            audioSrc: "assets/audio/landingPage_demo.mp3"
        },
        landing_vocal: {
            title: "Commande Vocale",
            mails: [
                {
                    type: "action",
                    title: "Infos manquantes",
                    from: "Marc",
                    body: "Peux-tu remplir le document demandé avant demain.",
                    tag: "🔥 ACTION"
                },
                {
                    type: "meeting",
                    title: "Réunion comptable",
                    from: "Sophie",
                    body: "Peux-tu proposer un créneau de 15 minutes pour la réunion avec le comptable.",
                    tag: "📅 MEETING"
                },
                {
                    type: "info",
                    title: "Absence fin de semaine",
                    from: "Cathy",
                    body: "Je ne serai pas là en fin de semaine.",
                    tag: "ℹ️ INFO"
                },
                {
                    type: "pub",
                    title: "Tester MIAL Vocal",
                    from: "MIAL",
                    body: "Teste Mial vocal gratuitement.",
                    tag: "🏷️ PUB"
                }
            ],
            audioSrc: "assets/audio/landingPage_demo.mp3"
        }
    };

    // 1. Detect Source
    const source = document.body.dataset.source;
    if (!source || !PHONE_DEMOS[source]) {
        console.warn("No valid data-source found on body for Phone Mock.");
        return;
    }

    const data = PHONE_DEMOS[source];

    // 2. Inject Date
    const dateEl = document.getElementById('lp-phone-date');
    if (dateEl) {
        const today = new Date();
        const dateString = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        // Capitalize month if desired, or keep lowercase as per prompt example "16 janvier"
        dateEl.textContent = `Dernier récap — ${dateString}`;
    }

    // 3. Audio
    const audioPlayer = document.getElementById('lp-phone-audio');
    const audioSrc = document.getElementById('lp-phone-audio-src');
    if (audioPlayer && audioSrc) {
        audioSrc.src = data.audioSrc;
        audioPlayer.load(); // Reload audio element to apply new src

        // Debug error
        audioPlayer.addEventListener('error', (e) => {
            console.warn("Audio load error:", e, audioPlayer.error);
        });

        // Track Play
        audioPlayer.addEventListener('play', () => {
            if (typeof gtag === 'function') {
                gtag('event', 'play_demo_audio', {
                    'event_category': 'audio',
                    'event_label': 'landing_demo'
                });
            }
        });
    }

    // 4. Mails
    const mailsContainer = document.getElementById('lp-phone-mails');
    if (mailsContainer && data.mails) {
        mailsContainer.innerHTML = ''; // Clear
        data.mails.forEach(mail => {
            const card = document.createElement('div');
            card.className = `lp-mail-card type-${mail.type}`;

            // Map type to tag class
            const tagClass = `lp-tag-${mail.type}`;

            card.innerHTML = `
                <div class="lp-mail-top">
                    <div class="lp-mail-title">${mail.title}</div>
                    <div class="lp-mail-tag ${tagClass}">${mail.tag}</div>
                </div>
                <div class="lp-mail-from">De: ${mail.from}</div>
                <div class="lp-mail-body">${mail.body}</div>
            `;
            mailsContainer.appendChild(card);
        });
    }

});

/* --- GESTION FORMULAIRE LEAD --- */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('lead-modal');
    const openBtns = document.querySelectorAll('.open-modal-btn');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('lead-form');
    const successMsg = document.getElementById('success-message');
    const formContainer = document.getElementById('form-container');

    // Sécurité si le HTML n'est pas complet
    if (!modal || !form) return;

    // Fonction d'ouverture
    const openModal = () => {
        modal.classList.add('active');
    };

    // Fonction de fermeture
    const closeModal = () => {
        modal.classList.remove('active');
    };

    // Listeners Boutons
    openBtns.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    }));

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Fermeture clic background
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Soumission API
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "Envoi en cours...";

        const formData = new FormData(form);

        // 1. Capture UTM & Source
        let sourceVal = document.body.dataset.source || 'landing_generic';
        const urlParams = new URLSearchParams(window.location.search);
        const utmParts = [];
        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(p => {
            if (urlParams.get(p)) {
                utmParts.push(`${p.replace('utm_', '')}:${urlParams.get(p)}`);
            }
        });
        if (utmParts.length > 0) {
            sourceVal += ` (${utmParts.join(', ')})`;
        }

        // 2. Construct Payload
        const payload = {
            email: formData.get('email'),
            first_name: formData.get('first_name'),
            phone: formData.get('phone'),
            profile_type: formData.get('profile_type'),
            message: formData.get('message'),
            source: sourceVal,
            user_agent: navigator.userAgent
        };

        // 3. Track Conversion (GA4)
        if (typeof gtag === 'function') {
            gtag('event', 'generate_lead', {
                'event_category': 'form',
                'event_label': 'resume_tester'
            });
        }

        try {
            // Utilisation de l'URL absolue pour supporter le test local et la prod
            const endpoint = 'https://mial.be/portal-api/api/lead';

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Succès visuel
                if (formContainer) formContainer.style.display = 'none';
                if (successMsg) successMsg.style.display = 'block';
            } else {
                throw new Error('Erreur API');
            }

        } catch (err) {
            console.error(err);
            alert("Une erreur est survenue. Merci de réessayer.");
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });

    /* --- TRACKING BOUTONS --- */
    // Helper track
    const trackClick = (label) => {
        if (typeof gtag === 'function') {
            gtag('event', 'click', {
                'event_category': 'button',
                'event_label': label
            });
        }
    };

    // 1. Bouton "Essayer gratuitement" (CTA Principal)
    document.querySelectorAll('.open-modal-btn').forEach(btn => {
        btn.addEventListener('click', () => trackClick('cta_try_free'));
    });

    // 2. Bouton "En savoir plus"
    const moreBtn = document.querySelector('.link-secondary');
    if (moreBtn) {
        moreBtn.addEventListener('click', () => trackClick('link_learn_more'));
    }

});
