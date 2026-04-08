export default function AuthPetRunner() {
  return (
    <div className="auth-pet-runner pointer-events-none z-[5]" aria-hidden="true">
      <div className="auth-pet-track">
        <div className="auth-pet auth-pet--dog">
          <img
            src="/background-animation/runningCatDog/dog.webp"
            alt=""
            className="auth-pet-img"
            width={120}
            height={120}
            decoding="async"
          />
        </div>
      </div>
    </div>
  );
}
