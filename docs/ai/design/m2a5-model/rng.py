# src/engine/rng.ts drawUniform의 Python 이식. 같은 (시드, 흐름, 커서)면 같은 값을 낸다.
# 검증: python3 -I rng.py 가 node 실행 값과 같은지 본다(m2a5/model/README 참고).
M32 = 0xFFFFFFFF


def _imul(a, b):
    return (a * b) & M32


def hash_string(text):
    h = 0x811C9DC5
    for ch in text:
        # JS charCodeAt: UTF-16 코드 단위. 흐름 이름은 ASCII만 쓴다.
        h ^= ord(ch)
        h = _imul(h, 0x01000193)
    return h & M32


def mix32(x):
    z = (x + 0x9E3779B9) & M32
    z = _imul(z ^ (z >> 16), 0x85EBCA6B)
    z = _imul(z ^ (z >> 13), 0xC2B2AE35)
    return (z ^ (z >> 16)) & M32


def draw_word(seed, stream, cursor):
    return mix32((seed & M32) ^ mix32(hash_string(stream) ^ mix32(cursor)))


class Stream:
    """한 흐름의 커서를 0부터 차례로 쓴다. 상태의 본 커서와 무관하다."""

    def __init__(self, seed, name):
        self.seed, self.name, self.cursor, self.log = seed, name, 0, []

    def uniform(self):
        w = draw_word(self.seed, self.name, self.cursor)
        self.cursor += 1
        v = w / 4294967296
        self.log.append(v)
        return v

    def int_between(self, lo, hi):
        # lo + floor(value × n). n이 작아 JS double에서도 정확하다.
        n = hi - lo + 1
        w = draw_word(self.seed, self.name, self.cursor)
        self.cursor += 1
        self.log.append(w / 4294967296)
        return lo + (w * n) // 4294967296

    def index(self, n):
        return self.int_between(0, n - 1)


if __name__ == '__main__':
    s = Stream(42032026, 'MARKET-B01')
    print([s.uniform() for _ in range(5)])
