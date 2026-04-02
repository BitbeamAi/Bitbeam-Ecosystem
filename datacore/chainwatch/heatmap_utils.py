from typing import List, Union

def generate_activity_heatmap(
    timestamps: List[int],
    counts: List[int],
    buckets: int = 10,
    normalize: bool = True
) -> List[Union[int, float]]:
    """
    Bucket activity counts into 'buckets' time intervals,
    returning either raw counts or normalized [0.0–1.0].

    Parameters
    ----------
    timestamps : List[int]
        Epoch millisecond timestamps.
    counts : List[int]
        Activity counts aligned with timestamps.
    buckets : int
        Number of time buckets to divide into.
    normalize : bool
        If True, output normalized floats in [0, 1],
        otherwise return raw bucket counts.

    Returns
    -------
    List[float] if normalize=True else List[int]
    """
    if not timestamps or not counts or len(timestamps) != len(counts):
        return [0.0] * buckets if normalize else [0] * buckets

    t_min, t_max = min(timestamps), max(timestamps)
    span = max(1, t_max - t_min)
    bucket_size = span / buckets

    agg = [0] * buckets
    for t, c in zip(timestamps, counts):
        idx = min(buckets - 1, int((t - t_min) / bucket_size))
        agg[idx] += c

    if normalize:
        max_val = max(agg) or 1
        return [round(val / max_val, 4) for val in agg]
    return agg


# Optional utility: merge multiple heatmaps elementwise
def merge_heatmaps(heatmaps: List[List[Union[int, float]]]) -> List[float]:
    """
    Merge multiple heatmaps by averaging values elementwise.
    Useful when combining activity patterns.
    """
    if not heatmaps:
        return []
    length = len(heatmaps[0])
    merged = [0.0] * length
    for h in heatmaps:
        if len(h) != length:
            raise ValueError("All heatmaps must have the same length")
        for i, val in enumerate(h):
            merged[i] += float(val)
    return [round(val / len(heatmaps), 4) for val in merged]
