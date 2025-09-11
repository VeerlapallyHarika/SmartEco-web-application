import tensorflow as tf

saved_model_dir = "models/waste_model_saved"
converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)

# Optimization
converter.optimizations = [tf.lite.Optimize.DEFAULT]

tflite_model = converter.convert()

with open("models/waste_model.tflite", "wb") as f:
    f.write(tflite_model)

print("✅ Model converted to TFLite")
