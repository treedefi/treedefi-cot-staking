import matplotlib.pyplot as plt
import numpy as np

# Parameters
pool_duration = 1000  # Assuming poolDuration is 1000 blocks
reward_rate = 10  # Assuming rewardRate is 10%
stake_amount = 100  # Assuming the user stakes 100 tokens

# Staking times
T0 = 0
T1 = 250
T2 = 500
T3 = 750
T4 = pool_duration

staking_times = [T0, T1, T2, T3]
unstaking_time = T4

# Calculate rewards at each time interval
rewards = []
staked_amounts = []

total_staked = 0
total_rewards = 0

time_range = np.arange(T0, T4 + 1)

for t in time_range:
    if t in staking_times:
        total_staked += stake_amount

    block_passed = min(t, pool_duration)
    user_rewards = block_passed * reward_rate * total_staked / pool_duration / 100
    total_rewards = user_rewards
    rewards.append(total_rewards)
    staked_amounts.append(total_staked)

# Plot the staked amounts and rewards over time
plt.figure()
plt.plot(time_range, staked_amounts, label='Staked Amount', color='blue')
plt.plot(time_range, rewards, label='Rewards', color='green')
plt.xlabel('Time (block)')
plt.ylabel('Amount')
plt.legend()
plt.show()
