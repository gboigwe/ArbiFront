import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import ArbiFundJson from './ArbiFund.json';
import styles from './App.module.css';

const contractABI = ArbiFundJson.abi;
const contractAddress = "0xd86c9e404B7d23ADE15c3b0b10CdA705772A5A36";

function App() {
  const [startups, setStartups] = useState([]);
  const [donationAmounts, setDonationAmounts] = useState({});
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setWalletAddress(accounts[0]);
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const arbiFundContract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(arbiFundContract);

          const startupCount = await arbiFundContract.startupCount();
          const startupArray = [];
          for (let i = 1; i <= startupCount; i++) {
            const startup = await arbiFundContract.getStartup(i);
            startupArray.push({ 
              id: i, 
              name: startup[0], 
              wallet: startup[1], 
              totalDonations: startup[2] 
            });
          }
          setStartups(startupArray);
        } catch (error) {
          console.error("Failed to initialize:", error);
          setError("Failed to connect to the blockchain. Please make sure you're connected to the correct network.");
        } finally {
          setLoading(false);
        }
      } else {
        setError("Ethereum object not found, please install MetaMask.");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleDonationChange = (id, amount) => {
    setDonationAmounts(prev => ({ ...prev, [id]: amount }));
  };

  const handleDonate = async (startupId) => {
    if (contract && donationAmounts[startupId]) {
      try {
        const tx = await contract.donate(startupId, { value: ethers.parseEther(donationAmounts[startupId]) });
        await tx.wait();
        alert('Donation successful!');
        // Refresh startup data
        const updatedStartup = await contract.getStartup(startupId);
        setStartups(prev => prev.map(s => 
          s.id === startupId ? {...s, totalDonations: updatedStartup[2]} : s
        ));
      } catch (error) {
        console.error('Error donating:', error);
        alert('Error donating. Please try again.');
      }
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>ArbiFund: Support African Startups</h1>
      
      {walletAddress && (
        <p className={styles.walletInfo}>Connected Wallet: {walletAddress}</p>
      )}

      {loading ? (
        <div className={styles.loadingSpinner}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : startups.length === 0 ? (
        <div className={styles.noStartups}>No startups found. Please check your connection and try again.</div>
      ) : (
        <div className={styles.startupList}>
          {startups.map((startup) => (
            <div key={startup.id} className={styles.startupCard}>
              <h2 className={styles.startupName}>{startup.name}</h2>
              <p className={styles.donationInfo}>
                Total Donations: {ethers.formatEther(startup.totalDonations)} ETH
              </p>
              <div className={styles.donationForm}>
                <input
                  type="text"
                  className={styles.donationInput}
                  value={donationAmounts[startup.id] || ''}
                  onChange={(e) => handleDonationChange(startup.id, e.target.value)}
                  placeholder="Amount in ETH"
                />
                <button 
                  className={styles.donateButton}
                  onClick={() => handleDonate(startup.id)}
                >
                  Donate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
