    // Variables globales pour la carte et la fenêtre d'information
    var map;
    var infoWindow;

    // Initialisation de la carte Google Maps
    function initMap() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: 45.75, lng: 4.85},
            zoom: 12,
            styles: [
                {featureType: "all", elementType: "labels", stylers: [{visibility: "off"}]},
                {featureType: "administrative.country", elementType: "labels", stylers: [{visibility: "on"}]},
                {featureType: "administrative.province", elementType: "labels", stylers: [{visibility: "on"}]},
                {featureType: "administrative.locality", elementType: "labels", stylers: [{visibility: "on"}]},
                {featureType: "administrative.land_parcel", elementType: "labels", stylers: [{visibility: "off"}]},
                {featureType: "administrative.neighborhood", elementType: "labels", stylers: [{visibility: "off"}]}
            ]
        });

        // Récupération des données des stations de vélos et ajout des marqueurs sur la carte
        fetch('/donnees_velo')
            .then(response => response.json())
            .then(data => ajouterMarqueursSurCarte(data));
    }

    // Fonction pour ajouter les marqueurs des stations de vélos sur la carte
    function ajouterMarqueursSurCarte(donnees_velo) {
        donnees_velo.forEach(station => {
            var position = {lat: station.position.latitude, lng: station.position.longitude};
            var icon;

            // Détermination de l'icône en fonction de la disponibilité des vélos dans la station
            if (station.totalStands.availabilities.mechanicalBikes > 0 && station.totalStands.availabilities.electricalBikes > 0) {
                icon = {url: '/static/images/bikePointerGreen.png', scaledSize: new google.maps.Size(40, 40)};
            } else if (station.totalStands.availabilities.mechanicalBikes > 0 || station.totalStands.availabilities.electricalBikes > 0) {
                icon = {url: '/static/images/bikePointerOrange.png', scaledSize: new google.maps.Size(40, 40)};
            } else {
                icon = {url: '/static/images/bikePointerRed.png', scaledSize: new google.maps.Size(40, 40)};
            }

            // Création du marqueur
            var marker = new google.maps.Marker({
                position: position,
                map: map,
                title: station.name,
                icon: icon
            });

            // Ajout d'un événement de clic pour afficher les informations de la station
            marker.addListener('click', function() {
                afficherInfosStation(station, marker);
            });
        });
    }

    // Fonction pour afficher les informations de la station dans une info-bulle
    function afficherInfosStation(station, marker) {
        // Fermeture de la fenêtre d'information précédente si ouverte
        if (infoWindow) {
            infoWindow.close();
        }
        // Création d'une nouvelle fenêtre d'information avec les détails de la station
        infoWindow = new google.maps.InfoWindow({
            content: '<h3>' + station.name + '</h3>' +
                    (station.address ? '<p><b>Adresse :</b> ' + station.address + '</p>' : '<p><i>Adresse non définie</i></p>') +
                    '<p><b>Nombre de vélos mécaniques:</b> ' + station.totalStands.availabilities.mechanicalBikes + '</p>' +
                    '<p><b>Nombre de vélos électriques:</b> ' + station.totalStands.availabilities.electricalBikes + '</p>' +
                    '<p><b>Statut :</b> ' + station.status + '</p>' +
                    '<p><b>Connecté :</b> ' + (station.connected ? 'Oui' : 'Non') + '</p>' +
                    '<p><b>Capacité totale :</b> ' + station.totalStands.capacity + '</p>' +
                    '<p><b>Bonus :</b> ' + (station.bonus ? 'Oui' : 'Non') + '</p>' +
                    '<p><b>Banking :</b> ' + (station.banking ? 'Oui' : 'Non') + '</p>' +
                    '<p><b>Overflow :</b> ' + (station.overflow ? 'Oui' : 'Non') + '</p>' +
                    '<p><b>Places disponibles :</b> ' + station.totalStands.availabilities.stands + '</p>' +
                    '<p><b>Vélos accrochés :</b> ' + station.totalStands.availabilities.bikes + '</p>'
        });
        // Affichage de la nouvelle fenêtre d'information au clic sur le marqueur
        infoWindow.open(map, marker);
    }

    // Fonction pour rechercher une station de vélo
    function searchStation() {
        var searchTerm = document.getElementById('search-input').value.toLowerCase();

        // Requête AJAX pour récupérer les données des stations de vélos
        fetch('/donnees_velo')
            .then(response => response.json())
            .then(data => {
                // Filtrage des stations correspondant au terme de recherche
                var matchingStations = data.filter(station => station.name.toLowerCase().includes(searchTerm));
                if (matchingStations.length > 0) {
                    // Création de marqueurs pour les stations trouvées
                    matchingStations.forEach(station => {
                        var marker = new google.maps.Marker({
                            position: {lat: station.position.latitude, lng: station.position.longitude},
                            map: map,
                            title: station.name
                        });
                        // Affichage des informations de la station au clic sur le marqueur
                        afficherInfosStation(station, marker);
                    });
                    // Centrage de la carte sur la première station trouvée
                    map.panTo({lat: matchingStations[0].position.latitude, lng: matchingStations[0].position.longitude});
                } else {
                    alert('Aucune station trouvée pour cette recherche.');
                }
            })
            .catch(error => {
                console.error('Erreur lors de la récupération des données des stations de vélos :', error);
            });
    }

    // Écouteur d'événement pour la touche "Enter" lors de la recherche
    document.getElementById('search-input').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchStation();
        }
    });
