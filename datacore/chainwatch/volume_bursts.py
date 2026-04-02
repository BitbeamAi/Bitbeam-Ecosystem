from typing import List, Dict, Union

def detect_volume_bursts(
    volumes: List[float],
    threshold_ratio: float = 1.5,
    min_interval: int = 1
) -> List[Dict[str, Union[int, float]]]:
    """
    Identify indices where volume jumps by threshold_ratio over the previous point.

    Parameters
    ----------
    volumes : List[float]
        Sequence of volume values.
    threshold_ratio : float
        Minimum ratio (current/previous) to qualify as a burst.
    min_interval : int
        Minimum number of steps required between consecutive bursts.

    Returns
    -------
    List[Dict[str, Union[int, float]]]
        Each dict contains:
        - index: int (position in the list)
        - previous: float (previous volume)
        - current: float (current volume)
        - ratio: float (current / previous, rounded to 4 decimals)
    """
    if not volumes or len(volumes) < 2:
        return []

    events: List[Dict[str, Union[int, float]]] = []
    last_idx = -min_interval

    for i in range(1, len(volumes)):
        prev, curr = volumes[i - 1], volumes[i]
        if prev <= 0:
            ratio = float("inf") if curr > 0 else 0.0
        else:
            ratio = curr / prev

        if ratio >= threshold_ratio and (i - last_idx) >= min_interval:
            events.append({
                "index": i,
                "previous": round(prev, 6),
                "current": round(curr, 6),
                "ratio": round(ratio, 4),
            })
            last_idx = i

    return events
