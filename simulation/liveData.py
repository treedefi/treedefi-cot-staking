import json
import numpy as np
import plotly.graph_objects as go
from web3 import Web3


def handle_stake(stake_event):
    global stake_amount
    stake_amount += stake_event['args']['amount']


def handle_unstake(unstake_event):
    global stake_amount
    stake_amount = 0


# Connect to Binance Smart Chain Testnet
w3 = Web3(Web3.HTTPProvider("https://data-seed-prebsc-1-s1.binance.org:8545"))

# Replace with your contract address and ABI file path
contract_address = "0x06A2bD2A16BC899fdB3fB384228c6D8858028aaE"
abi_file = "ABI.JSON"

# Load ABI
with open(abi_file) as f:
    contract_abi = json.load(f)

# Initialize the contract
contract = w3.eth.contract(address=Web3.to_checksum_address(contract_address), abi=contract_abi)

# Get parameters from the smart contract
pool_duration = contract.functions.poolDuration().call()
reward_rate = contract.functions.rewardRate().call()

# User's address (replace with the actual address)
user_address = "0x5047fa5adA80E29816E91DC87E1451eBEe21A021"

# Initialize stake_amount
stake_amount = 0

# Fetch past events
stake_events = contract.events.Staked.create_filter(fromBlock=0, toBlock='latest', argument_filters={'user': user_address}).get_all_entries()
unstake_events = contract.events.Unstaked.create_filter(fromBlock=0, toBlock='latest', argument_filters={'user': user_address}).get_all_entries()

# Process events in chronological order
events = stake_events + unstake_events
events.sort(key=lambda x: x['blockNumber'])

for event in events:
    if event['event'] == 'Staked':
        handle_stake(event)
    elif event['event'] == 'Unstaked':
        handle_unstake(event)

# Calculate rewards at each time interval
rewards = []
staked_amounts = []

total_staked = stake_amount
total_rewards = 0

time_range = np.arange(0, pool_duration + 1)

for t in time_range:
    block_passed = min(t, pool_duration)
    user_rewards = block_passed * reward_rate * total_staked / pool_duration / 100
    total_rewards = user_rewards
    rewards.append(w3.from_wei(total_rewards, 'ether'))
    staked_amounts.append(w3.from_wei(total_staked, 'ether'))

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
