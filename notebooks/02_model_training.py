import tensorflow as tf
from tensorflow.keras import layers, models

# Build CNN model (you can replace with MobileNetV2/ResNet)
model = models.Sequential([
    layers.Input(shape=(224, 224, 3)),
    layers.Conv2D(32, (3,3), activation="relu"),
    layers.MaxPooling2D(),
    layers.Conv2D(64, (3,3), activation="relu"),
    layers.MaxPooling2D(),
    layers.Flatten(),
    layers.Dense(128, activation="relu"),
    layers.Dense(3, activation="softmax")
])

model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

# Train
history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=10,
    callbacks=[
        tf.keras.callbacks.ModelCheckpoint("models/checkpoints/cp-{epoch:03d}.ckpt", save_weights_only=True)
    ]
)

# Save models
model.save("models/waste_model.h5")
model.save("models/waste_model_saved")
