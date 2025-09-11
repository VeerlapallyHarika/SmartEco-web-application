import tensorflow as tf
import numpy as np
from PIL import Image

# Load model
model = tf.keras.models.load_model("models/waste_model.h5")

def predict_image(img_path):
    img = Image.open(img_path).resize((224,224))
    img_array = np.expand_dims(np.array(img)/255.0, axis=0)
    preds = model.predict(img_array)
    class_names = ["biodegradable", "recyclable", "hazardous"]
    return class_names[np.argmax(preds)], np.max(preds)

# Test
img_path = "data/test/recyclable/sample.jpg"
label, conf = predict_image(img_path)
print(f"Prediction: {label} ({conf:.2f})")
