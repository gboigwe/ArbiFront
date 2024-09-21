import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ArbiFundJson from '../../arbifund/out/ArbiFund.sol';

const contractABI = ArbiFundJson.abi;
const contractAddress = "0xd86c9e404B7d23ADE15c3b0b10CdA705772A5A36";

function App() {
  const [startups, setStartups] = useState([]);
  const [donationAmount, setDonationAmount] = useState('');
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const arbiFundContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(arbiFundContract);

        // Fetch startups
        const startupCount = await arbiFundContract.startupCount();
        const startupArray = [];
        for (let i = 1; i <= startupCount; i++) {
          const startup = await arbiFundContract.getStartup(i);
          startupArray.push({ id: i, name: startup[0], wallet: startup[1], totalDonations: startup[2] });
        }
        setStartups(startupArray);
      }
    };
    init();
  }, []);

  const handleDonate = async (startupId) => {
    if (contract && donationAmount) {
      try {
        const tx = await contract.donate(startupId, { value: ethers.utils.parseEther(donationAmount) });
        await tx.wait();
        alert('Donation successful!');
        // Refresh startups data
      } catch (error) {
        console.error('Error donating:', error);
        alert('Error donating. Please try again.');
      }
    }
  };

  return (
    <div className="App">
      <h1>ArbiFund: Support African Startups</h1>
      {startups.map((startup) => (
        <div key={startup.id}>
          <h2>{startup.name}</h2>
          <p>Total Donations: {ethers.utils.formatEther(startup.totalDonations)} ETH</p>
          <input
            type="text"
            value={donationAmount}
            onChange={(e) => setDonationAmount(e.target.value)}
            placeholder="Amount in ETH"
          />
          <button onClick={() => handleDonate(startup.id)}>Donate</button>
        </div>
      ))}
    </div>
  );
}

export default App;
