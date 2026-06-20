import { FORGET_ME_NOT_URL } from '../lib/assets';

/** Soft forget-me-not accents for calming home screens */
export default function FlowerGarden() {
  return (
    <div className="flower-garden" aria-hidden>
      <img src={FORGET_ME_NOT_URL} alt="" className="flower-garden__bloom flower-garden__bloom--1" />
      <img src={FORGET_ME_NOT_URL} alt="" className="flower-garden__bloom flower-garden__bloom--2" />
      <img src={FORGET_ME_NOT_URL} alt="" className="flower-garden__bloom flower-garden__bloom--3" />
      <img src={FORGET_ME_NOT_URL} alt="" className="flower-garden__bloom flower-garden__bloom--4" />
    </div>
  );
}
