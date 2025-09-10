# src/dataset.py
import tensorflow as tf

IMG_SIZE = (224,224)
BATCH_SIZE = 32

def make_datasets(data_dir):
    train_ds = tf.keras.preprocessing.image_dataset_from_directory(
        str(data_dir / "train"),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='int',
        shuffle=True,
        validation_split=0.0
    )
    val_ds = tf.keras.preprocessing.image_dataset_from_directory(
        str(data_dir / "val"),
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        label_mode='int',
        shuffle=False
    )
    AUTOTUNE = tf.data.AUTOTUNE
    normalize = tf.keras.layers.Rescaling(1./255)
    train_ds = train_ds.map(lambda x,y: (normalize(x), y)).prefetch(AUTOTUNE)
    val_ds = val_ds.map(lambda x,y: (normalize(x), y)).prefetch(AUTOTUNE)
    return train_ds, val_ds
