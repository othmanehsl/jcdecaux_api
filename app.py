import requests
import json
from flask import Flask, render_template, jsonify
from apscheduler.schedulers.background import BackgroundScheduler

app = Flask(__name__)

# Clé API JCDecaux
CLE_API = "e0a1bf2c844edb9084efc764c089dd748676cc14"

# Fonction pour récupérer les données des stations de vélos
def obtenir_donnees_station_velo():
    url = "https://api.jcdecaux.com/vls/v3/stations"
    params = {"apiKey": CLE_API}
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()  # Gestion des erreurs HTTP
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erreur lors de la récupération des données des stations de vélos : {e}")
        return None

# Fonction pour calculer le pourcentage de vélos électriques et mécaniques par rapport au nombre total de vélos dans chaque station
def obtenir_pourcentage_velos_mecaniques_electriques(data):
    pourcentages = {}
    for station in data:
        total_velos = station["totalStands"]["capacity"]
        velos_mecaniques = station["totalStands"]["availabilities"]["mechanicalBikes"]
        velos_electriques = station["totalStands"]["availabilities"]["electricalBikes"]
        
        if total_velos > 0:
            pourcentage_mecaniques = (velos_mecaniques / total_velos) * 100
            pourcentage_electriques = (velos_electriques / total_velos) * 100
        else:
            pourcentage_mecaniques = 0.0
            pourcentage_electriques = 0.0
        
        pourcentages[station["name"]] = {
            "total_velos": total_velos,
            "velos_mecaniques": velos_mecaniques,
            "pourcentage_mecaniques": round(pourcentage_mecaniques, 2),
            "velos_electriques": velos_electriques,
            "pourcentage_electriques": round(pourcentage_electriques, 2)
        }
    return pourcentages

# Fonction pour récupérer les 5 villes avec le plus de vélos
def obtenir_top_villes(data):
    villes_compte_velo = {}
    for station in data:
        ville = station["contractName"]
        total_velos = station["totalStands"]["capacity"]
        villes_compte_velo.setdefault(ville, 0)
        villes_compte_velo[ville] += total_velos
    villes_triees = sorted(villes_compte_velo.items(), key=lambda x: x[1], reverse=True)[:5]
    return villes_triees

# Fonction pour mettre à jour les données toutes les minutes
def mettre_a_jour_donnees():
    global donnees_velo
    donnees_velo = obtenir_donnees_station_velo()

# Route pour afficher la carte
@app.route("/")
def index():
    top_villes = obtenir_top_villes(donnees_velo)
    pourcentages_velos = obtenir_pourcentage_velos_mecaniques_electriques(donnees_velo)
    return render_template("map.html", top_villes=top_villes, pourcentages_velos=pourcentages_velos)

# Route pour renvoyer les données des stations de vélos au format JSON
@app.route("/donnees_velo")
def obtenir_donnees_velo():
    return jsonify(donnees_velo)

if __name__ == "__main__":
    # Initialisation des données des stations de vélos
    donnees_velo = obtenir_donnees_station_velo()
    
    # Configuration du planificateur pour mettre à jour les données toutes les minutes
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=mettre_a_jour_donnees, trigger="interval", minutes=1)
    scheduler.start()
    
    # Lancement de l'application Flask en mode debug
    app.run(debug=True)
