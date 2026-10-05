"""PNG 원본 청크를 읽어 Pillow 변환 전에 비트 깊이와 색 공간을 확인한다."""
import io
import struct
from PIL import Image, ImageCms


def png_errors(path):
    data = path.read_bytes()
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        return []
    errors = []
    if len(data) < 29 or data[24] != 8:
        errors.append('비트 깊이: 8비트 PNG만 허용합니다.')
    offset = 8
    chunks = {}
    while offset + 12 <= len(data):
        length = struct.unpack('>I', data[offset:offset+4])[0]
        kind = data[offset+4:offset+8]
        chunks[kind] = data[offset+8:offset+8+length]
        offset += length + 12
    if b'acTL' in chunks:
        errors.append('애니메이션: 움직이는 PNG(APNG)는 허용하지 않습니다.')
    if b'gAMA' in chunks and chunks[b'gAMA'] != struct.pack('>I', 45455):
        errors.append('감마: sRGB 감마(0.45455)만 허용합니다.')
    if b'iCCP' in chunks:
        # 프로필 이름만 믿지 않고 표본 색이 sRGB와 같은지 변환으로 확인한다.
        try:
            with Image.open(path) as image:
                profile = ImageCms.ImageCmsProfile(io.BytesIO(image.info['icc_profile']))
            samples = Image.new('RGB', (256, 1))
            samples.putdata([(i, (i*67) % 256, (i*131) % 256) for i in range(256)])
            converted = ImageCms.profileToProfile(samples, profile, ImageCms.createProfile('sRGB'), outputMode='RGB')
            if any(abs(a-b) > 1 for left, right in zip(samples.get_flattened_data(), converted.get_flattened_data()) for a,b in zip(left,right)):
                raise ValueError('sRGB와 다른 프로필')
        except (OSError, ValueError, ImageCms.PyCMSError):
            errors.append('색 프로필: sRGB가 아닌 iCCP는 허용하지 않습니다.')
    return errors
