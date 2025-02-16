from flask import Flask, request, jsonify

app = Flask(__name__)

# Exemple de fonction de prédiction (à remplacer par votre modèle)
def predict(model_args):
    # Pour l'instant, on retourne une prédiction factice
    return {"prediction": "dummy_value", "input": model_args}

@app.route('/predict', methods=['GET'])
def predict_route():
    # Extraction des paramètres du modèle depuis les query parameters
    model_args = request.args.to_dict()
    # Obtenir la prédiction
    result = predict(model_args)
    # Format de réponse standardisé
    return jsonify({"code": 200, "data": result})

if __name__ == '__main__':
    app.run(debug=True)
