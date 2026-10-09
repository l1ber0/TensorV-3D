import torch

# Edit these coordinates, then pause typing to update the 3D arrows.
vectors = torch.tensor([
    [3.0, 1.0, 2.0],
    [-2.0, 3.0, 1.0],
    [1.0, -2.0, 3.0],
])

# Select "cube" in the 3D tensor picker to see every element as a cube.
cube = torch.arange(64, dtype=torch.float32).reshape(4, 4, 4)

# Non-contiguous views keep their original logical coordinates.
transposed = cube.transpose(0, 2)
