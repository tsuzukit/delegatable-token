pragma solidity 0.4.20;

import "./Ownable.sol";

// This contract is heavily inspired by uPort from https://github.com/uport-project/uport-identity/blob/develop/contracts/TxRelay.sol
contract Delegatable is Ownable {

    // Note: This is a local nonce.
    // Different from the nonce defined w/in protocol.
    mapping(address => uint) public nonce;

    // Whitelisted address can invoke operation delegated by user
    mapping(address => bool) public whitelist;

    /*
     * @dev Relays meta transactions
     * @param sigV, sigR, sigS ECDSA signature on some data to be forwarded
     * @param data The bytes necessary to call the function in this contract
     * @param sender address of sender who originally signed data
     */
    modifier delegate(
        uint8 sigV,
        bytes32 sigR,
        bytes32 sigS,
        bytes data
    ) {

        // caller should be whitelisted
        require(whitelist[msg.sender]);

        // recover sender from transaction data
        address sender = decodeSender(data);

        // use EIP 191
        // 0x19 :: version :: relay :: nonce :: data
        bytes32 h = sha3(byte(0x19), byte(0), this, nonce[sender], data);
        address signer = ecrecover(h, sigV, sigR, sigS);

        // address recovered from signature must match with claimed sender
        require(sender == signer);

        _;

        //if we are going to do tx, update nonce
        nonce[sender]++;
    }

    /*
     * Decode packed data formatted as below
     * { 20 bytes sender }{ 20 bytes sender }{ 32 bytes amount }
     */
    function decodeSender(bytes b) internal constant returns (address from) {
        assembly {
            from := mload(add(b, 20))
        }
    }

    /*
     * Adds an address which can do operation
     * @param add the addresses to add to the whitelist
     */
    function addToWhitelist(address add) public onlyOwner {
        whitelist[add] = true;
    }

    /*
     * Remove an address which can do operation
     * @param add the addresses to add to the whitelist
     */
    function removeFromWhitelist(address add) public onlyOwner {
        whitelist[add] = false;
    }

}