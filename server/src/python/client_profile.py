class Client:
    client_count = 0
    average_valence = 0.0
    average_arousal = 0.0
    variance_valence = 0.0
    variance_arousal = 0.0
    sd_valence = 0.0
    sd_arousal = 0.0

    def __init__(self):
        self.valence = 0.0
        self.arousal = 0.0
