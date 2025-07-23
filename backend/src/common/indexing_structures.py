from enum import Enum

class IndexingStructure(Enum):
    KD_TREE = "kd_tree"
    BALL_TREE = "ball_tree"
    BRUTE_FORCE = "brute_force"