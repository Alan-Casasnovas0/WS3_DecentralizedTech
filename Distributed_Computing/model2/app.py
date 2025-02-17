from flask import Flask, jsonify, request
import pickle
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris

app = Flask(__name__)

# Train and save model
iris = load_iris()
model = DecisionTreeClassifier(max_depth=3)
model.fit(iris.data, iris.target)
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

@app.route('/predict', methods=['GET'])
def predict():
    try:
        features = [float(request.args.get(f)) for f in 
                   ['sepal_length', 'sepal_width', 'petal_length', 'petal_width']]
        prediction = model.predict([features])[0]
        return jsonify({
            'prediction': int(prediction),
            'model': 'decision_tree',
            'confidence': float(model.predict_proba([features]).max())
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(port=5002)