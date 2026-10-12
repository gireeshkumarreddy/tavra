# TĀVRA hero film — video prompts

The hero currently builds its "outfit change" from the six TĀVRA photos. To turn it into a real
scroll-scrubbed film of one woman changing looks, generate the clips below with an image-to-video tool
and send them back; the scroll-scrub engine from the earlier version can play them frame by frame.

## How to shoot it

- **One clip per change** (5 clips: Lotus → Vermilion → Bengal → Ivory → Paisley → Noir).
- **Chain them:** use the last frame of each clip as the start image of the next, so the joins are seamless.
- **Hide the change in a turn:** she turns away from camera and back; the outfit is different when she faces forward again.
- **Framing:** locked-off camera, full body head to trainers, figure centred, plain warm-white studio seamless,
  soft even light, no props. A plain background lets the site place her in the arch.
- **Spec:** 1080 × 1620 (2:3 portrait) or 1920 × 1080 with her centred, 24 fps, 4–6 s per clip.

## The model (same in every prompt)

An Indian woman in her late twenties, dark hair in a low ponytail, natural makeup, small gold stud earrings.

## The looks

1. **Lotus:** forest-green scoop-neck sports bra, cropped forest-green zip studio jacket worn open, high-rise forest-green
   legging with a single pink lotus stem printed along the outer seam of one leg, ivory trainers.
2. **Vermilion:** vermilion racer-back sports bra, red running shorts with a fine cream paisley repeat, white socks, ivory trainers.
3. **Bengal:** navy track jacket with ivory sleeves illustrated with tigers and jungle foliage in Indian miniature-painting style,
   gold-tone zip, navy track pants with a single ivory side piping and gathered ankles, ivory trainers.
4. **Ivory:** ivory square-neck training top, ivory running shorts with a tonal gold botanical border at the hem, ivory trainers.
5. **Paisley:** fitted burgundy zip top with an indigo and ivory floral-paisley pattern, navy joggers, navy cap, ivory trainers.
6. **Noir:** black high-collar technical vest with tonal black lotus linework over a black long-sleeve base layer,
   wide black track trousers, black trainers.

## Prompt template

> Premium sportswear fashion film. Locked-off full-body shot on a plain warm-white studio seamless, soft even light.
> [The model] stands centred facing camera wearing [look A]. She turns slowly away from camera and back; when she faces
> forward again she is wearing [look B]. Realistic fabric, natural skin texture, correct anatomy, no text, no logos.

Example for clip 1: [look A] = Lotus, [look B] = Vermilion. Start image: a still of her in the Lotus look.

## Encoding

H.264 MP4 with a keyframe every 12 frames (smooth scrubbing in every browser):

```bash
ffmpeg -i clip.mov -c:v libx264 -crf 18 -g 12 -pix_fmt yuv420p -movflags +faststart -an clip.mp4
```
