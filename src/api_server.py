# src/api_server.py
from fastapi import FastAPI, File, UploadFile
import uvicorn
from io import BytesIO
from PIL import Image
import numpy as np
import tensorflow as tf

app = FastAPI()
MODEL_PATH = "models/saved_model_waste_classifier"
model = tf.keras.models.load_model(MODEL_PATH)
CLASS_NAMES = ['biodegradable','recyclable','hazardous']
THRESH = 0.6
IMG_SIZE=(224,224)

def preprocess_image(contents):
    img = Image.open(BytesIO(contents)).convert('RGB').resize(IMG_SIZE)
    arr = np.array(img)/255.0
    return np.expand_dims(arr, 0)

@app.post("/classify")
async def classify(file: UploadFile = File(...)):
    contents = await file.read()
    img = preprocess_image(contents)
    probs = model.predict(img)[0].tolist()
    maxp = max(probs)
    label = CLASS_NAMES[int(np.argmax(probs))]
    fallback = maxp < THRESH
    return {"label": label, "confidence": float(maxp), "confidences": probs, "fallback": bool(fallback)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
