
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
