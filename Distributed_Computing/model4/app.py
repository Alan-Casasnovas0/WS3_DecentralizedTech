from flask import Flask, jsonify, request
import pickle
import numpy as np
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.datasets import load_iris

app = Flask(__name__)

# Train and save model
iris = load_iris()
scaler = StandardScaler()
X_scaled = scaler.fit_transform(iris.data)
model = MLPClassifier(hidden_layer_sizes=(10, 5), max_iter=1000)
model.fit(X_scaled, iris.target)
with open('model.pkl', 'wb') as f:
    pickle.dump({'model': model, 'scaler': scaler}, f)

@app.route('/predict', methods=['GET'])
def predict():
    try:
        raw_features = [float(request.args.get(f)) for f in 
                       ['sepal_length', 'sepal_width', 
                        'petal_length', 'petal_width']]
        features = np.array([raw_features])
        loaded = pickle.load(open('model.pkl', 'rb'))
        scaler = loaded['scaler']
        model = loaded['model']
        
        scaled_features = scaler.transform(features)
        prediction = model.predict(scaled_features)[0]
        
        return jsonify({
            'prediction': int(prediction),
            'model': 'neural_net',
            'confidence': float(model.predict_proba(scaled_features).max())
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(port=5004)