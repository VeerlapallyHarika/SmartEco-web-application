# src/convert_tflite.py
import tensorflow as tf
import numpy as np
import os

# Paths
SAVED_MODEL_DIR = "models/saved_model_waste_classifier"
FLOAT16_PATH = "models/waste_model_float16.tflite"
INT8_PATH = "models/waste_model_int8.tflite"

# ============= Float16 Quantization =============
def convert_float16():
    converter = tf.lite.TFLiteConverter.from_saved_model(SAVED_MODEL_DIR)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]

    tflite_model = converter.convert()

    os.makedirs("models", exist_ok=True)
    with open(FLOAT16_PATH, "wb") as f:
        f.write(tflite_model)

    print(f"✅ Float16 TFLite model saved at: {FLOAT16_PATH}")


# ============= Full Integer (INT8) Quantization =============
def representative_dataset():
    # Replace val_ds with your validation dataset
    for batch in val_ds.take(100):  # 100 batches is usually enough
        images, _ = batch
        for img in images:
            yield [tf.expand_dims(img, 0)]

def convert_int8(val_ds):
    converter = tf.lite.TFLiteConverter.from_saved_model(SAVED_MODEL_DIR)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.representative_dataset = representative_dataset
    converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]

    converter.inference_input_type = tf.uint8
    converter.inference_output_type = tf.uint8

    tflite_model = converter.convert()

    os.makedirs("models", exist_ok=True)
    with open(INT8_PATH, "wb") as f:
        f.write(tflite_model)

    print(f"✅ INT8 TFLite model saved at: {INT8_PATH}")


# ============= Quick Test Inference =============
def test_inference(model_path, sample_image):
    interpreter = tf.lite.Interpreter(model_path=model_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    # Preprocess image to match training (normalize/resize before calling this)
    input_data = np.expand_dims(sample_image, axis=0).astype(np.float32)

    interpreter.set_tensor(input_details[0]['index'], input_data)
    interpreter.invoke()
    preds = interpreter.get_tensor(output_details[0]['index'])

    print(f"✅ Predictions from {model_path}: {preds}")
    return preds


if __name__ == "__main__":
    # Run Float16 conversion
    convert_float16()

    # For INT8 conversion, you must pass val_ds (your validation dataset)
    # convert_int8(val_ds)

    # Example test (replace with an actual preprocessed image)
    # test_inference(FLOAT16_PATH, your_preprocessed_image)
