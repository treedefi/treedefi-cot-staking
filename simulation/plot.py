import matplotlib.pyplot as plt
import numpy as np

# Constants from the unit test file
pool_size = 1000
reward_rate = 10
min_stacking_lock_time = 100
pool_duration = 200

# Users data
users = [
    {
        "address": "user1",
        "balance": 1000,
        "staked": 0,
        "reward": 0,
    },
    {
        "address": "user2",
        "balance": 1000,
        "staked": 0,
        "reward": 0,
    },
]

# Staking simulation
stakes = []

for user in users:
    stake_amount = user["balance"] // 2
    user["staked"] += stake_amount
    user["balance"] -= stake_amount
    stakes.append({"user": user["address"], "staked": stake_amount})

# Calculate pending rewards
for stake in stakes:
    user = next(filter(lambda u: u["address"] == stake["user"], users))
    user["reward"] += stake["staked"] * reward_rate * pool_duration // 100

# Plot results
fig, ax = plt.subplots()
x = np.arange(len(users))
width = 0.35

balance_rects = ax.bar(x - width / 2, [user["balance"] for user in users], width, label="Balance")
staked_rects = ax.bar(x + width / 2, [user["staked"] for user in users], width, label="Staked")

ax.set_ylabel("Amount")
ax.set_title("Staking Simulation")
ax.set_xticks(x)
ax.set_xticklabels([user["address"] for user in users])
ax.legend()

ax.bar_label(balance_rects, padding=3)
ax.bar_label(staked_rects, padding=3)

fig.tight_layout()
plt.show()
