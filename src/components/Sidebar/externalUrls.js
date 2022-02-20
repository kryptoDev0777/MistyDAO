import { ReactComponent as ForumIcon } from "../../assets/icons/forum.svg";
import { ReactComponent as GovIcon } from "../../assets/icons/governance.svg";
import { ReactComponent as DocsIcon } from "../../assets/icons/docs.svg";
import { ReactComponent as SpookySwapIcon } from "../../assets/icons/spookyswap.svg";
import { ReactComponent as SpiritSwapIcon } from "../../assets/icons/spiritswap.svg";
import { ReactComponent as FeedbackIcon } from "../../assets/icons/feedback.svg";
import { SvgIcon } from "@material-ui/core";
import { AccountBalanceOutlined, MonetizationOnOutlined } from "@material-ui/icons";

const externalUrls = [
  {
    title: "Buy on PancakeSwap",
    url: "https://pancakeswap.finance/swap?inputCurrency=&outputCurrency=0x54Cea670B34667822152348C289Fd31b4A6CD9bc",
    icon: <img color="primary" src="/images/pancakeswap.png" width="24px" height="24px" style={{"margin-right":"10px"}}/>,
  },
  // {
  //   title: "Buy on SpiritSwap",
  //   url: "https://swap.spiritswap.finance/#/exchange/swap/0x5c4fdfc5233f935f20d2adba572f770c2e377ab0",
  //   icon: <SvgIcon viewBox="0 0 155 172" color="primary" component={SpiritSwapIcon} />,
  // },
  // {
  //   title: "Mist Lend",
  //   label: "(Coming soon)",
  //   icon: <MonetizationOnOutlined viewBox="0 0 20 24" />,
  // },
  // {
  //   title: "Mist Borrow",
  //   label: "(Coming soon)",
  //   icon: <MonetizationOnOutlined viewBox="0 0 20 24" />,
  // },
  // {
  //   title: "Mist PRO",
  //   label: "(Coming soon)",
  //   icon: <AccountBalanceOutlined viewBox="0 0 20 24" />,
  // },
  // {
  //   title: "Governance",
  //   url: "https://snapshot.org/#/galacticdao.eth",
  //   icon: <SvgIcon color="primary" component={GovIcon} />,
  // },
  {
    title: "Docs",
    url: "https://lamees-a.gitbook.io/misty-dao-1/",
    icon: <SvgIcon color="primary" component={DocsIcon} />,
  },
];

export default externalUrls;
