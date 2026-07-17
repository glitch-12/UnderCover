# GitHub Setup Log

Companion to [BUILD_LOG.md](./BUILD_LOG.md). Records how this repo got connected to GitHub (`glitch-12/UnderCover`), every auth error hit along the way, and the fix — so a re-clone on a new machine can follow the same path without rediscovering it.

Repo: [github.com/glitch-12/UnderCover](https://github.com/glitch-12/UnderCover)

---

## 1. Committing the local work

Before touching GitHub at all, the Step 1–3 scaffolding work was staged and committed locally:

```bash
git add -A
git commit -m "Scaffold platform architecture: navigation shell, theme, and docs"
```

Result: commit `badca20` on top of the existing `2796cff Initial commit`, 30 files changed.

---

## 2. Wiring the remote (attempt 1 — HTTPS)

No remote existed yet (`git remote -v` returned nothing). The user created an empty GitHub repo (no README/license, so it wouldn't conflict with local history) and shared the HTTPS URL:

```bash
git remote add origin https://github.com/glitch-12/UnderCover.git
```

### Error A — no credentials available at all
```bash
git push -u origin main
→ fatal: could not read Username for 'https://github.com': Device not configured
```
Cause: `credential.helper=osxkeychain` was configured, but had nothing cached for `github.com` yet, and this shell has no TTY to prompt interactively for a username.

This could not be fixed from the assistant side — entering a password or token on the user's behalf is off-limits regardless of the underlying cause. The user was asked to either push manually themselves (so they'd hit the OS-level auth prompt directly) or authenticate first and hand back control.

### Error B — password rejected outright
The user tried pushing with their actual GitHub account username + password and got:
```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/glitch-12/UnderCover.git/'
```
Cause: **not a typo or wrong password** — GitHub removed plain password authentication for git operations in August 2021. HTTPS git operations now require either a Personal Access Token (PAT) used in place of the password, or SSH key authentication. This applies to every GitHub account, with no exceptions.

Two ways forward were offered: a PAT (user runs the push themselves and pastes the token when prompted — the assistant never handles the token) or an SSH key (assistant can safely generate the keypair locally, since a public key has nothing to protect). **User chose SSH.**

---

## 3. Switching to SSH auth

### Step 1 — generate a dedicated keypair
```bash
mkdir -p ~/.ssh && chmod 700 ~/.ssh
ssh-keygen -t ed25519 -C "vaibhavisharma.rlb@gmail.com" \
  -f ~/.ssh/id_ed25519_github_undercover -N ""
```
- `-N ""` — no passphrase, for a git-automation-only key (acceptable tradeoff for a dev machine; would use a passphrase + `ssh-agent` caching for anything higher-stakes).
- Named the key file distinctly (`id_ed25519_github_undercover`) rather than the default `id_ed25519`, so it doesn't collide with any other SSH identity that might get added on this machine later.
- Public key (safe to share, shown to the user to paste into GitHub):
  ```
  ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ4Ya9AG7DPAJQn9RjEKhnfBzsJ4Mo17Qp1BYm5msDhD vaibhavisharma.rlb@gmail.com
  ```

### Step 2 — scope the key to github.com only
```bash
cat >> ~/.ssh/config <<'EOF'

Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github_undercover
  IdentitiesOnly yes
EOF
```
`IdentitiesOnly yes` ensures SSH only offers this specific key for github.com, not every key in `~/.ssh/`.

### Step 3 — load it into the agent/keychain
```bash
eval "$(ssh-agent -s)"
ssh-add --apple-use-keychain ~/.ssh/id_ed25519_github_undercover
```
`--apple-use-keychain` persists it in the macOS keychain so it survives reboots without re-adding.

### Step 4 — user adds the public key to GitHub
Manual step done by the user: **GitHub → Settings → SSH and GPG keys → New SSH key**, pasted the public key above.

### Error C — host key not trusted yet
```bash
ssh -T git@github.com
→ Host key verification failed.
```
Cause: this machine had never connected to `github.com` over SSH before, so GitHub's host key wasn't in `~/.ssh/known_hosts`. This is expected on any first-ever SSH connection to a new host, not specific to this setup.
Fix:
```bash
ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts
```

### Verification
```bash
ssh -T git@github.com
→ Hi glitch-12! You've successfully authenticated, but GitHub does not provide shell access.
```
That "shell access" message is GitHub's normal, expected response to `ssh -T` — it confirms the key works, it isn't an error.

---

## 4. Final push

```bash
git remote set-url origin git@github.com:glitch-12/UnderCover.git
git push -u origin main
```
Result:
```
To github.com:glitch-12/UnderCover.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```

`main` (commits `2796cff`, `badca20`) is now on GitHub, tracked, and future `git push`/`git pull` from this machine will authenticate silently via the cached SSH key — no further credential prompts.

---

## Summary — what to do differently on a fresh machine

If this ever needs to be repeated (new laptop, CI runner, etc.):
1. Skip straight to SSH — don't bother trying HTTPS + password, it will always fail (Error B is permanent GitHub policy, not a bug to work around).
2. Generate the keypair, add the public key to GitHub, run `ssh-keyscan` for `known_hosts` *before* the first push attempt (avoids Error C).
3. Use `git@github.com:<user>/<repo>.git` as the remote URL from the start, never the `https://` form, if SSH is the intended auth method.
