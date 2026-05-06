_cache = None


def handler():
    global _cache
    _cache = {"user": "data"}
    with open("/tmp/output.txt", "w") as f:
        f.write("bad")
