# src/train.py
import tensorflow as tf
from tensorflow.keras import layers, models
from dataset import make_datasets
import pathlib
import numpy as np

DATA_DIR = pathlib.Path("data")
IMG_SIZE = (224,224)
BATCH_SIZE = 32
NUM_CLASSES = 3
EPOCHS_HEAD = 8
EPOCHS_FINETUNE = 12

train_ds, val_ds = make_datasets(DATA_DIR)

base_model = tf.keras.applications.MobileNetV2(input_shape=(*IMG_SIZE,3), include_top=False, weights='imagenet')
base_model.trainable = False

inputs = tf.keras.Input(shape=(*IMG_SIZE,3))
x = layers.Rescaling(1./255)(inputs)  # if not in dataset pipeline
x = data_augmentation(x)               # optional
x = base_model(x, training=False)
x = layers.GlobalAveragePooling2D()(x)
x = layers.Dropout(0.3)(x)
outputs = layers.Dense(NUM_CLASSES, activation='softmax')(x)

model = models.Model(inputs, outputs)
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# Head training
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_HEAD)

# Fine-tune
base_model.trainable = True
for layer in base_model.layers[:-30]:
    layer.trainable = False
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FINETUNE)
model.save("models/saved_model_waste_classifier")
