from flask import Flask, jsonify, request
import requests
import json
from collections import defaultdict

app = Flask(__name__)
DATABASE = 'models.json'

def load_models():
    with open(DATABASE) as f:
        return json.load(f)

def save_models(models):
    with open(DATABASE, 'w') as f:
        json.dump(models, f)

@app.route('/predict', methods=['GET'])
def consensus_predict():
    models = load_models()
    predictions = []
    
    # Collect predictions from all models
    for model in models:
        try:
            response = requests.get(
                f"{model['address']}/predict",
                params=request.args
            )
            if response.status_code == 200:
                predictions.append(response.json())
        except:
            continue
    
    # Calculate consensus (simple average)
    votes = [p['prediction'] for p in predictions]
    consensus = max(set(votes), key=votes.count)
    
    # Update model weights and apply slashing
    update_weights(predictions, consensus)
    
    return jsonify({
        'consensus_prediction': int(consensus),
        'individual_predictions': predictions,
        'species': ['setosa', 'versicolor', 'virginica'][consensus]
    })

def update_weights(predictions, consensus):
    models = load_models()
    total = sum(m['balance'] for m in models)
    
    for model in models:
        # Find matching prediction
        pred = next((p for p in predictions if p['model'] == model['name']), None)
        if not pred:
            continue
            
        # Slashing condition
        if pred['prediction'] != consensus:
            model['balance'] = max(0, model['balance'] - model['deposit'] * 0.1)
            
        # Update weight based on balance
        model['weight'] = model['balance'] / model['deposit']
    
    save_models(models)

if __name__ == '__main__':
    app.run(port=5000)