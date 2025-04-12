// Initialize the map and load vet data
let map;
let userLocation;
let markers = [];
let vetData = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    initMap();
    
    // Set up event listeners
    document.getElementById('searchBtn').addEventListener('click', filterVets);
    document.getElementById('vetSearch').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') filterVets();
    });
    document.getElementById('specialtyFilter').addEventListener('change', filterVets);
    document.getElementById('locateMe').addEventListener('click', locateUser);
    document.getElementById('refreshVets').addEventListener('click', refreshVets);
    
    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            sortVets(this.dataset.sort);
        });
    });
    
    // Close modal
    document.querySelector('.close-modal').addEventListener('click', closeModal);
});

function initMap() {
    // Default to a central location if geolocation fails or isn't available
    const defaultLocation = { lat: -1.2921, lng: 36.8219 }; // Nairobi coordinates
    
    map = new google.maps.Map(document.getElementById('vetMap'), {
        center: defaultLocation,
        zoom: 12,
        styles: [
            {
                "featureType": "poi.medical",
                "elementType": "labels.icon",
                "stylers": [
                    { "visibility": "on" },
                    { "color": "#4CAF50" }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "labels",
                "stylers": [
                    { "visibility": "off" }
                ]
            }
        ]
    });
    
    // Try to get user's location
    locateUser();
}

function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user's location
                map.setCenter(userLocation);
                
                // Add user marker
                new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "white"
                    },
                    title: "Your Location"
                });
                
                // Load nearby vets
                loadNearbyVets();
            },
            error => {
                console.error("Geolocation error:", error);
                // Use default location if geolocation fails
                userLocation = defaultLocation;
                loadNearbyVets();
            }
        );
    } else {
        console.log("Geolocation is not supported by this browser.");
        userLocation = defaultLocation;
        loadNearbyVets();
    }
}

function loadNearbyVets() {
    // Show loading state
    document.getElementById('vetCards').innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading nearby agro-vets...</p>
        </div>
    `;
    
    // In a real app, you would fetch this from your backend
    // For now, we'll use mock data
    setTimeout(() => {
        vetData = getMockVetData();
        displayVets(vetData);
        placeMarkers(vetData);
    }, 1000);
}

function getMockVetData() {
    // Generate some mock vet data around the user's location
    const specialties = ['General', 'Poultry', 'Dairy', 'Crops'];
    const services = [
        'Vaccinations', 'Diagnostics', 'Surgery', 'Pharmacy', 
        'Feed Supplements', 'Equipment', 'Consultation'
    ];
    
    const mockVets = [];
    
    for (let i = 1; i <= 12; i++) {
        // Generate random location near user
        const lat = userLocation.lat + (Math.random() * 0.02 - 0.01);
        const lng = userLocation.lng + (Math.random() * 0.02 - 0.01);
        
        // Calculate distance (simplified)
        const distance = (Math.random() * 15 + 1).toFixed(1);
        
        mockVets.push({
            id: i,
            name: `Agro-Vet ${i}`,
            address: `${100 + i} Vet Street, Area ${i}`,
            phone: `07${Math.floor(10000000 + Math.random() * 90000000)}`,
            location: { lat, lng },
            distance: parseFloat(distance),
            rating: Math.floor(Math.random() * 2) + 3 + Math.random(),
            specialty: specialties[Math.floor(Math.random() * specialties.length)],
            hours: '8:00 AM - 6:00 PM',
            services: services.slice(0, Math.floor(Math.random() * 4) + 3),
            reviews: [
                {
                    author: `Farmer ${i}`,
                    date: '2023-06-15',
                    rating: 4,
                    comment: 'Very helpful staff and good prices for medications.'
                },
                {
                    author: `Farmer ${i + 1}`,
                    date: '2023-06-10',
                    rating: 5,
                    comment: 'Saved my entire flock with their quick diagnosis!'
                }
            ]
        });
    }
    
    return mockVets;
}

function displayVets(vets) {
    const vetCardsContainer = document.getElementById('vetCards');
    vetCardsContainer.innerHTML = '';
    
    if (vets.length === 0) {
        vetCardsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>No agro-vets found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    vets.forEach(vet => {
        const vetCard = document.createElement('div');
        vetCard.className = 'vet-card';
        vetCard.dataset.id = vet.id;
        
        // Generate star rating HTML
        const fullStars = Math.floor(vet.rating);
        const hasHalfStar = vet.rating % 1 >= 0.5;
        let starsHtml = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                starsHtml += '<i class="fas fa-star"></i>';
            } else if (i === fullStars && hasHalfStar) {
                starsHtml += '<i class="fas fa-star-half-alt"></i>';
            } else {
                starsHtml += '<i class="far fa-star"></i>';
            }
        }
        
        vetCard.innerHTML = `
            <h3>${vet.name}</h3>
            <p class="vet-distance">${vet.distance} km away</p>
            <span class="vet-specialty">${vet.specialty}</span>
            <div class="vet-info">
                <div class="vet-rating">${starsHtml} ${vet.rating.toFixed(1)}</div>
                <button class="vet-actions">Details <i class="fas fa-chevron-right"></i></button>
            </div>
        `;
        
        vetCard.addEventListener('click', () => openVetModal(vet.id));
        vetCardsContainer.appendChild(vetCard);
    });
}

function placeMarkers(vets) {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    
    vets.forEach(vet => {
        const marker = new google.maps.Marker({
            position: vet.location,
            map: map,
            icon: {
                url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
                scaledSize: new google.maps.Size(32, 32)
            },
            title: vet.name
        });
        
        marker.addListener('click', () => {
            openVetModal(vet.id);
            // Center the map on this marker with a slight offset
            map.panTo({
                lat: vet.location.lat + 0.005,
                lng: vet.location.lng
            });
        });
        
        markers.push(marker);
    });
}

function openVetModal(vetId) {
    const vet = vetData.find(v => v.id === vetId);
    if (!vet) return;
    
    // Populate modal with vet data
    document.getElementById('modalVetName').textContent = vet.name;
    document.getElementById('modalAddress').textContent = vet.address;
    document.getElementById('modalPhone').textContent = vet.phone;
    document.getElementById('modalHours').textContent = `Open: ${vet.hours}`;
    document.getElementById('modalSpecialties').textContent = vet.specialty;
    
    // Generate star rating
    const fullStars = Math.floor(vet.rating);
    const hasHalfStar = vet.rating % 1 >= 0.5;
    let starsHtml = '';
    
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starsHtml += '<i class="fas fa-star"></i>';
        } else if (i === fullStars && hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHtml += '<i class="far fa-star"></i>';
        }
    }
    
    document.getElementById('modalRating').innerHTML = starsHtml + ` ${vet.rating.toFixed(1)}`;
    
    // Display services
    const servicesContainer = document.getElementById('modalServices');
    servicesContainer.innerHTML = '';
    vet.services.forEach(service => {
        const serviceTag = document.createElement('span');
        serviceTag.className = 'service-tag';
        serviceTag.textContent = service;
        servicesContainer.appendChild(serviceTag);
    });
    
    // Display reviews
    const reviewsContainer = document.getElementById('modalReviews');
    reviewsContainer.innerHTML = '';
    vet.reviews.forEach(review => {
        const reviewCard = document.createElement('div');
        reviewCard.className = 'review-card';
        
        // Generate star rating for review
        let reviewStars = '';
        for (let i = 0; i < 5; i++) {
            reviewStars += i < review.rating ? 
                '<i class="fas fa-star"></i>' : 
                '<i class="far fa-star"></i>';
        }
        
        reviewCard.innerHTML = `
            <div class="review-author">${review.author}</div>
            <div class="review-date">${review.date}</div>
            <div class="review-rating">${reviewStars}</div>
            <div class="review-comment">${review.comment}</div>
        `;
        reviewsContainer.appendChild(reviewCard);
    });
    
    // Initialize modal map
    const modalMap = new google.maps.Map(document.getElementById('modalMap'), {
        center: vet.location,
        zoom: 15,
        disableDefaultUI: true
    });
    
    new google.maps.Marker({
        position: vet.location,
        map: modalMap,
        icon: {
            url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
            scaledSize: new google.maps.Size(40, 40)
        }
    });
    
    // Set up call button
    document.querySelector('.call-btn').onclick = () => {
        window.location.href = `tel:${vet.phone}`;
    };
    
    // Set up directions button
    document.querySelector('.directions-btn').onclick = () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${vet.location.lat},${vet.location.lng}`);
    };
    
    // Show the modal
    document.getElementById('vetModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('vetModal').style.display = 'none';
}

function filterVets() {
    const searchTerm = document.getElementById('vetSearch').value.toLowerCase();
    const specialtyFilter = document.getElementById('specialtyFilter').value;
    
    let filteredVets = vetData.filter(vet => {
        const matchesSearch = vet.name.toLowerCase().includes(searchTerm) || 
                             vet.specialty.toLowerCase().includes(searchTerm) ||
                             vet.services.some(s => s.toLowerCase().includes(searchTerm));
        
        const matchesSpecialty = specialtyFilter === 'all' || vet.specialty === specialtyFilter;
        
        return matchesSearch && matchesSpecialty;
    });
    
    displayVets(filteredVets);
    placeMarkers(filteredVets);
}

function sortVets(sortBy) {
    let sortedVets = [...vetData];
    
    switch(sortBy) {
        case 'distance':
            sortedVets.sort((a, b) => a.distance - b.distance);
            break;
        case 'rating':
            sortedVets.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
            sortedVets.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    displayVets(sortedVets);
}

function refreshVets() {
    loadNearbyVets();
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('vetModal');
    if (event.target === modal) {
        closeModal();
    }
};