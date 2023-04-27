import numpy as np
import plotly.graph_objects as go

# Parameters
pool_duration = 1000  # Assuming poolDuration is 1000 blocks
reward_rate = 20  # Assuming rewardRate is 20%
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

# Create an interactive plot using Plotly
fig = go.Figure()

fig.add_trace(go.Scatter(x=time_range, y=staked_amounts, name='Staked Amount', line=dict(color='blue')))
fig.add_trace(go.Scatter(x=time_range, y=rewards, name='Rewards', line=dict(color='green')))

fig.update_layout(
    title="Staking and Rewards Growth",
    xaxis_title="Time (block)",
    yaxis_title="Amount",
    legend_title="Legend",
)

# Add annotations for the parameters
annotations = [
    dict(xref='paper', yref='paper', x=1, y=1.08, xanchor='right', yanchor='bottom',
         text=f'Pool Duration: {pool_duration} blocks, Reward Rate: {reward_rate}',
         showarrow=False, font=dict(size=14))
]

fig.update_layout(annotations=annotations, margin=dict(t=100))

fig.show()
