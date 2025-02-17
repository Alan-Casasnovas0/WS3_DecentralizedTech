from flask import Flask, jsonify, request
import pickle
import numpy as np
from sklearn.datasets import load_iris
from sklearn.linear_model import LogisticRegression

app = Flask(__name__)

iris = load_iris()
model = LogisticRegression()
model.fit(iris.data, iris.target)
with open('model.pkl', 'wb') as f:
    pickle.dump(model, f)

@app.route('/predict', methods=['GET'])
def predict():
    try:
        features = np.array([[float(request.args.get(f)) for f in 
                            ['sepal_length', 'sepal_width', 
                             'petal_length', 'petal_width']]])
        prediction = model.predict(features)[0]
        return jsonify({
            'prediction': int(prediction),
            'model': 'logistic_regression',
            'probabilities': model.predict_proba(features)[0].tolist()
        })
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(port=5001)