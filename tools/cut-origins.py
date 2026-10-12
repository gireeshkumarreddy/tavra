# Cuts the four origin screenshots (garment + framed art reference + a word printed over the photo)
# into clean pieces for the Origins collage: each garment photo and each artwork on its own. Words and
# frames are cropped away; the one word on plain fabric is covered with the fabric beside it (OpenCV
# Poisson cloning); where a word sits on busy print (the joggers, the brocade skort) the crop stops above it.
# Run from the tavra folder:
#   python tools/cut-origins.py
import os
import cv2
import numpy as np

SRC = os.path.join(os.path.dirname(__file__), '..', 'assets', 'photos')


def load(name):
    return cv2.imread(os.path.join(SRC, name + '.webp'), cv2.IMREAD_COLOR)


def save(img, name, q=88):
    cv2.imwrite(os.path.join(SRC, name + '.webp'), img, [cv2.IMWRITE_WEBP_QUALITY, q])
    h, w = img.shape[:2]
    print(f'{name}.webp  {w}x{h}')


def patch(img, box, dy, dx=0):
    """Covers box with the same fabric from dy/dx pixels away, blended in (Poisson cloning)."""
    x0, y0, x1, y1 = box
    src = img[y0 + dy:y1 + dy, x0 + dx:x1 + dx].copy()
    mask = np.full(src.shape[:2], 255, np.uint8)
    return cv2.seamlessClone(src, img, mask, ((x0 + x1) // 2, (y0 + y1) // 2), cv2.NORMAL_CLONE)


# 1 · mudra jacket: front and back as separate photos, and the Pichwai painting
im = load('origin-mudra')
save(im[0:873, 0:436], 'og-mudra-front')
save(im[0:873, 720:1179], 'og-mudra-back')            # cropped clear of the frame and the word
save(im[18:362, 462:695], 'og-art-pichwai')

# 2 · block-print zip top: the whole look, and the block-print fabric
im = load('origin-blockprint')
save(im[0:652, 120:728], 'og-blockprint')                            # cap to waistband, clear of the frame and the word
save(im[14:450, 764:1050], 'og-art-blockprint')

# 3 · Bengal kit flat lay (cap, tiger-sleeve jacket, crop, joggers), and the tiger painting
im = load('origin-tiger')
clean = patch(im, (424, 876, 524, 948), -74)                          # the word, covered with the sleeve just above
save(clean[478:1590, 34:928], 'og-tiger-kit')
save(im[226:444, 586:909], 'og-art-tiger')

# 4 · brocade court skort: the look, and the Banarasi silk
im = load('origin-brocade')
save(im[0:676, 150:738], 'og-brocade')                               # down to the brocade waistband, above the word
save(im[34:460, 768:1062], 'og-art-banarasi')
