document.addEventListener('DOMContentLoaded', () => {
    // Typing Animation for Landing Page
    const typedTextElement = document.getElementById('typed-text');
    const words = ["Server Minecraft Terbaik", "Petualangan Tanpa Batas", "Komunitas Ramah"];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 150;
    let deletingSpeed = 100;
    let delayBetweenWords = 1500;

    function type() {
        const currentWord = words[wordIndex];
        if (isDeleting) {
            typedTextElement.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typedTextElement.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        if (!isDeleting && charIndex === currentWord.length) {
            // Word typed, start deleting after a delay
            setTimeout(() => isDeleting = true, delayBetweenWords);
            typingSpeed = 150; // Reset typing speed
        } else if (isDeleting && charIndex === 0) {
            // Word deleted, move to next word
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typingSpeed = 150; // Reset typing speed
        }

        const currentSpeed = isDeleting ? deletingSpeed : typingSpeed;
        setTimeout(type, currentSpeed);
    }

    if (typedTextElement) {
        type();
    }

    // Hamburger Menu Functionality
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    const navLinks = document.querySelectorAll('.mobile-nav-overlay .nav-close');

    hamburgerMenu.addEventListener('click', () => {
        hamburgerMenu.classList.toggle('active');
        mobileNavOverlay.classList.toggle('active');
        document.body.style.overflow = mobileNavOverlay.classList.contains('active') ? 'hidden' : 'auto';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburgerMenu.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    });

    // Smooth Scrolling for Navigation Links
    document.querySelectorAll('.nav-links a, .mobile-nav-links a, .footer-links a').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                document.querySelector(targetId).scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Firebase Integration for Report Bug ---
    // Mengakses instance db dan serverTimestamp dari window yang sudah diinisialisasi di index.html
    const db = window.db;
    const serverTimestamp = window.serverTimestamp;

    // Pastikan Firebase sudah diinisialisasi sebelum mencoba menggunakannya
    if (!db) {
        console.error("Firebase Firestore belum diinisialisasi. Pastikan Firebase SDK dimuat dan diinisialisasi dengan benar di index.html.");
        // Berikan pesan error di UI jika Firebase tidak tersedia
        const reportSection = document.getElementById('report-bug');
        if (reportSection) {
            const errorDiv = document.createElement('div');
            errorDiv.classList.add('report-message');
            errorDiv.style.display = 'block';
            errorDiv.style.backgroundColor = 'rgba(255, 99, 71, 0.2)';
            errorDiv.style.borderColor = 'tomato';
            errorDiv.style.color = 'tomato';
            errorDiv.textContent = 'Gagal memuat fungsionalitas laporan. Periksa koneksi atau konfigurasi Firebase.';
            reportSection.querySelector('.container').prepend(errorDiv);
        }
        return; // Hentikan eksekusi jika db tidak tersedia
    }

    const reportForm = document.getElementById('reportForm');
    const reportMessage = document.getElementById('report-message');
    const recentReportsList = document.getElementById('recent-reports-list');
    const noReportsMessage = document.getElementById('no-reports-message');

    // Function to fetch and display reports
    const fetchReports = async () => {
        recentReportsList.innerHTML = '<p class="loading-message">Memuat laporan...</p>'; // Show loading message
        noReportsMessage.style.display = 'none'; // Hide "no reports" message initially

        try {
            // Mengambil laporan, diurutkan berdasarkan timestamp terbaru (descending)
            const querySnapshot = await db.collection("bugReports")
                                        .orderBy("timestamp", "desc")
                                        .limit(10) // Tampilkan 10 laporan terbaru
                                        .get();

            recentReportsList.innerHTML = ''; // Hapus pesan loading

            if (querySnapshot.empty) {
                noReportsMessage.style.display = 'block'; // Tampilkan pesan "belum ada laporan"
                return;
            }

            querySnapshot.forEach((doc) => {
                const report = doc.data();
                const reportCard = document.createElement('div');
                reportCard.classList.add('report-card');

                // Format timestamp
                // Periksa jika timestamp ada dan merupakan objek Timestamp Firebase yang valid
                const date = report.timestamp && typeof report.timestamp.toDate === 'function' ? new Date(report.timestamp.toDate()) : new Date();
                const formattedDate = date.toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                reportCard.innerHTML = `
                    <h4>${report.type.toUpperCase()} dari ${report.name}</h4>
                    <p>${report.description}</p>
                    <p class="report-meta">Dilaporkan pada: ${formattedDate}</p>
                `;
                recentReportsList.appendChild(reportCard);
            });
        } catch (error) {
            console.error("Error fetching reports: ", error);
            recentReportsList.innerHTML = '<p class="loading-message" style="color: tomato;">Gagal memuat laporan. Coba refresh halaman.</p>';
        }
    };

    // Panggil fungsi fetchReports setelah halaman dimuat (dengan sedikit delay)
    // Delay ini untuk memastikan Firebase db sudah sepenuhnya diinisialisasi
    setTimeout(() => {
        fetchReports();
    }, 100); 
    

    if (reportForm) {
        reportForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const reporterName = document.getElementById('reporter-name').value;
            const reportType = document.getElementById('report-type').value;
            const reportDescription = document.getElementById('report-description-text').value;

            // Validasi sederhana (opsional, bisa lebih kompleks)
            if (!reporterName || !reportType || !reportDescription) {
                reportMessage.textContent = 'Harap lengkapi semua kolom form laporan.';
                reportMessage.style.backgroundColor = 'rgba(255, 165, 0, 0.2)';
                reportMessage.style.borderColor = 'orange';
                reportMessage.style.color = 'orange';
                reportMessage.style.display = 'block';
                setTimeout(() => { reportMessage.style.display = 'none'; }, 5000);
                return;
            }

            try {
                // Tambahkan laporan ke Firestore
                await db.collection("bugReports").add({
                    name: reporterName,
                    type: reportType,
                    description: reportDescription,
                    timestamp: serverTimestamp() // Menggunakan serverTimestamp()
                });

                reportForm.reset(); // Kosongkan form
                reportMessage.textContent = 'Terima kasih, laporan Anda telah kami terima!';
                reportMessage.style.backgroundColor = 'rgba(76, 175, 80, 0.2)'; // Hijau untuk sukses
                reportMessage.style.borderColor = 'var(--primary-color)';
                reportMessage.style.color = 'var(--primary-color)';
                reportMessage.style.display = 'block';

                // Muat ulang laporan setelah pengiriman sukses
                fetchReports();

            } catch (error) {
                console.error("Error adding document: ", error);
                reportMessage.textContent = 'Terjadi kesalahan saat mengirim laporan. Silakan coba lagi.';
                reportMessage.style.backgroundColor = 'rgba(255, 99, 71, 0.2)'; // Merah untuk error
                reportMessage.style.borderColor = 'tomato';
                reportMessage.style.color = 'tomato';
                reportMessage.style.display = 'block';
            } finally {
                setTimeout(() => {
                    reportMessage.style.display = 'none';
                    reportMessage.textContent = '';
                }, 5000); // Sembunyikan pesan setelah 5 detik
            }
        });
    }
});