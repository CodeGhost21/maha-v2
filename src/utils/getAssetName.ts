

export const getAssetName = (address: string) => {
    if(address === "0x7651f6C3Fa619E40A48fc7a60D34BCFc7897C362" || 
        address === "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48") return 'USDC'
    else if(address === "0x2f73a674CEB69279EB3044d192A4842e0627d3b0" || 
        address === "0x8CC0F052fff7eaD7f2EdCCcaC895502E884a8a71") return 'ARTH'
    else if(address === "0x6B175474E89094C44Da98b954EedeAC495271d0F") return 'DAI'
    return ''
}