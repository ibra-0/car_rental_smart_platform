import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useApp } from "../context/AppContext";
import { authService } from "../services/authService";
export default function Auth({ register = false }: { register?: boolean }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser } = useApp();
  const navigate = useNavigate();
  return (
    <div className="auth-layout container page">
      <div className="auth-photo">
        <img src="/images/hero.jpg" alt="A car ready for a new journey" />
        <div>
          <h2>
            Good things
            <br />
            are up ahead.
          </h2>
          <p>Your next journey starts with DriveRent.</p>
        </div>
      </div>
      <div className="auth-form">
        <span className="eyebrow">Your road starts here</span>
        <h1>{register ? "A little more freedom." : "Welcome back."}</h1>
        <p>
          {register
            ? "Create a demo profile and find your next drive."
            : "Sign in to your demo driving experience."}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            try {
              setUser(
                authService.signIn(
                  register ? name : "Demo driver",
                  email,
                  password,
                ),
              );
              setPassword("");
              navigate("/dashboard");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          {register && (
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                minLength={2}
              />
            </label>
          )}
          <label>
            Email address
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <div className="password-field">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                minLength={8}
                required
              />
              <button
                type="button"
                aria-label={show ? "Hide password" : "Show password"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
            <small>
              Demo only. Use a fictional password of at least 8 characters.
            </small>
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <Button type="submit">
            {register ? "Create demo account" : "Sign in"}
          </Button>
          <div className="or-divider">or take a look around</div>
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              setUser(authService.demo());
              navigate("/dashboard");
            }}
          >
            Continue as demo driver
          </Button>
        </form>
        <p>
          {register ? "Already have a profile?" : "New to DriveRent?"}{" "}
          <Link className="text-link" to={register ? "/login" : "/register"}>
            {register ? "Sign in" : "Create an account"}
          </Link>
        </p>
        <div className="panel-note">
          <ShieldCheck size={18} /> Demo authentication. No credentials are
          stored or verified.
        </div>
      </div>
    </div>
  );
}
