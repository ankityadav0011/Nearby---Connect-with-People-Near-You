import { motion, useMotionValue, useTransform } from "framer-motion";
import { imgUrl } from "../api.js";

const variants = {
  enter: { scale: 0.96, opacity: 0 },
  center: { scale: 1, opacity: 1 },
  exit: (dir) => ({
    x: dir === "like" ? 520 : -520,
    rotate: dir === "like" ? 18 : -18,
    opacity: 0,
    transition: { duration: 0.25 },
  }),
};

// Drag it left/right, or use the buttons / arrow keys on the parent screen
export default function SwipeCard({ card, dir, onSwipe }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-12, 12]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const passOpacity = useTransform(x, [-130, -30], [1, 0]);

  return (
    <motion.article
      className="card"
      style={{ x, rotate }}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      custom={dir}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110) onSwipe("like");
        else if (info.offset.x < -110) onSwipe("pass");
      }}
    >
      <img src={imgUrl(card.photo)} alt={`${card.name}'s profile photo`} draggable={false} />
      <motion.span className="stamp like" style={{ opacity: likeOpacity }}>✓</motion.span>
      <motion.span className="stamp pass" style={{ opacity: passOpacity }}>✕</motion.span>
      <div className="card-info">
        <span className="distance">{card.distanceKm} km away</span>
        <h2>{card.name}, {card.age}</h2>
        {card.bio && <p>{card.bio}</p>}
      </div>
    </motion.article>
  );
}
