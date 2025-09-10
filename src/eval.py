# src/eval.py
import tensorflow as tf
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
import pathlib

model = tf.keras.models.load_model("models/saved_model_waste_classifier")
test_ds = tf.keras.preprocessing.image_dataset_from_directory(
    "data/test", image_size=(224,224), batch_size=32, shuffle=False
)

y_true = np.concatenate([y.numpy() for x,y in test_ds], axis=0)
pred_probs = model.predict(test_ds)
y_pred = np.argmax(pred_probs, axis=1)

print(classification_report(y_true, y_pred, target_names=test_ds.class_names))
print(confusion_matrix(y_true, y_pred))
