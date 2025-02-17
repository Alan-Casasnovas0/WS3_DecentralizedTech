To use the Iris distributed computing predictions,  
Reach in the directory and use these commands in separate terminals  
  
cd model1 && python app.py  		# Runs on port 5001  
cd model2 && python app.py  		# Runs on port 5002  
cd model3 && python app.py  		# Runs on port 5003  
cd model4 && python app.py  		# Runs on port 5004  
cd consensus_service && python app.py  	# Runs on port 5000  
  
Then you can try the models by using this link format :  
http://localhost:5000/predict?sepal_length=5.1&sepal_width=3.5&petal_length=1.4&petal_width=0.2  

