import React from "react";
import { withRouter } from "react-router";
import { withStyles } from "@material-ui/core";
import backend from "../backend";
import { SettingsContext } from "../SettingsContext";
import språk from "../språk";
import VenstreVinduContainer from "../VenstreVinduContainer";
import bakgrunnskarttema from "./bakgrunnskarttema";
import TopBar from "../TopBar/TopBar";
import MobileNavigation from "../components/MobileNavigation";
import Kart from "../Kart/LeafletTangram";

const styles = {
  rot: {
    backgroundColor: "#f5f5f5",
    color: "hsla(0, 0%, 0%, 0.87)",
    boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
    position: "fixed",
    left: 0,
    border: 1,
    width: 408,
    height: "100vh",
    zIndex: -10,
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column"
  },
  transparent: {
    backgroundColor: "transparent",
    boxShadow: "none",
    pointerEvents: "none"
  }
};

class Grunnkart extends React.Component {
  constructor(props) {
    super(props);
    let aktive = {
      bakgrunnskart: JSON.parse(JSON.stringify(bakgrunnskarttema))
    };
    this.state = {
      aktiveLag: aktive,
      opplystKode: "",
      actualBounds: null,
      fitBounds: null,
      meta: null,
      visKoder: false
    };
    this.props.history.listen((location, action) => {
      // Åpne menyen ved navigering
      this.context.onNavigateToTab("meny");
    });
  }

  handleActualBoundsChange = bounds => {
    this.setState({ actualBounds: bounds, fitBounds: null });
  };

  handleFitBounds = bbox => this.setState({ fitBounds: bbox });

  handleBoundsChange = bbox => {
    this.setState({ actualBounds: bbox });
  };

  addSelectedBarn(barn) {
    return barn.map(node => {
      const kode = node.kode;
      return {
        kode: kode,
        tittel: språk(node.tittel),
        farge: node.farge,
        erSynlig: true,
        kanSlettes: true,
        value: node.value
      };
    });
  }

  addSelected = props => {
    let aktive = this.state.aktiveLag;
    if (!props.kart) return;
    const nyttLag = JSON.parse(JSON.stringify(props));
    nyttLag.visBarn = props.barn.length > 0;
    nyttLag.kanSlettes = true;
    aktive[nyttLag.kode] = nyttLag;
    this.setState({
      aktiveLag: Object.assign({}, aktive)
    });
  };

  handleToggleLayer = () => {
    this.addSelected(this.state.meta);
  };

  handleClearSearchFor = () => this.setState({ searchFor: null });

  componentDidMount() {
    this.fetchMeta(this.props.location.pathname);
  }

  componentDidUpdate(prevProps, prevState) {
    const path = this.props.location.pathname;
    if (path !== prevProps.location.pathname) this.fetchMeta(path);
    document.title =
      (this.state.meta && this.state.meta.tittel.nb) || "Natur i Norge";
  }

  redirectTo(path) {
    const newUrl = "/" + path;
    console.log("router videre til ", newUrl);
    this.props.history.replace(newUrl);
  }

  fetchMeta(location) {
    let url = location.match(/\/(.*)/);
    this.setState({ meta: null });
    if (!url || url.length !== 2 || !url[1]) return;
    const path = url[1].replace(/katalog/i, "");
    this.downloadMeta(path).then(data => {
      if (!data) {
        this.setState({ searchFor: path });
        return;
      }
      if (data.se) {
        const newUrl = data.se[Object.keys(data.se)[0]].sti;
        this.redirectTo(newUrl);
        return;
      }
      this.setState({ meta: data, opplystKode: "" });
    });
  }

  async downloadMeta(url) {
    const meta = await backend.hentKodeMeta(url);
    if (!meta) return;
    if (!meta.tittel) {
      return this.redirectTo("Natur_i_Norge");
    }
    if (meta.se) return meta;
    meta.prefiks = meta.kode.replace("NN-", "").substring(0, 2);

    if (!meta.kart) meta.kart = {};
    if (!meta.kart.format) meta.kart.format = {};
    if (!meta.kart.aktivtFormat)
      meta.kart.aktivtFormat = Object.keys(meta.kart.format)[0];
    if (meta.kart.format.raster_gradient) {
      meta.aktivtFormat = "raster_gradient";
      const gradient = meta.kart.format.raster_gradient;
      gradient.aktivVisning = gradient.visning[0];
      const intervall = gradient.intervall.original;
      gradient.filterMin = intervall[0];
      gradient.filterMax = intervall[1];
    }
    meta.erSynlig = true;
    meta.depth = 3;
    if (meta.kode.substring(0, 2) === "LA") {
      if (!this.state.aktiveLag.bakgrunnskart.terreng.wasAutoEnabled) {
        this.handleUpdateLayerProp("bakgrunnskart.terreng", "erSynlig", true);
        this.handleUpdateLayerProp(
          "bakgrunnskart.terreng",
          "wasAutoEnabled",
          true
        );
      }
    }
    return meta;
  }

  handleRemoveSelectedLayer = kode => {
    let aktive = this.state.aktiveLag;
    delete aktive[kode];
    this.setState({ aktiveLag: aktive });
    this.props.history.push("/");
  };

  // Supports composite keys i.e. gradient.filterMin
  handleUpdateLayerProp = (layer, key, value) => {
    const aktive = this.state.aktiveLag;
    let node = aktive[layer];
    if (!node) node = this.state.meta;
    const parts = key.split(".");
    for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]];
    const vkey = parts[parts.length - 1];
    node[vkey] = value;
    this.setState({ aktiveLag: Object.assign({}, aktive) });
  };

  // Supports composite keys i.e. gradient.filterMin
  handleUpdateMetaProp = (kode, key, value) => {
    const aktive = this.state.meta;
    let node = aktive.barn[kode];
    const parts = key.split(".");
    for (let i = 0; i < parts.length - 1; i++) node = node[parts[i]];
    const vkey = parts[parts.length - 1];
    node[vkey] = value;
    aktive.barn[kode] = Object.assign({}, aktive.barn[kode]);
    this.setState({ meta: Object.assign({}, aktive) });
  };

  render() {
    const { history } = this.props;
    let erAktivert = false;
    if (this.state.meta)
      erAktivert = !!this.state.aktiveLag[this.state.meta.kode];

    return (
      <SettingsContext.Consumer>
        {context => {
          return (
            <>
              <TopBar
                onSelectResult={item => {
                  history.push("/" + item.url);
                }}
              />
              <div>
                {context.aktivTab === "meny" && (
                  <div className="sidebar">
                    <VenstreVinduContainer
                      aktiveLag={this.state.aktiveLag}
                      mapBounds={this.state.actualBounds}
                      onMouseEnter={this.handleMouseEnter}
                      onMouseLeave={this.handleMouseLeave}
                      onFitBounds={this.handleFitBounds}
                      erAktivert={erAktivert}
                      opplystKode={this.state.opplystKode}
                      onToggleLayer={() => {
                        this.handleToggleLayer();
                        if (!context.visAktiveLag) context.onToggleAktiveLag();
                      }}
                      onRemoveSelectedLayer={this.handleRemoveSelectedLayer}
                      meta={this.state.meta}
                      searchFor={this.state.searchFor}
                      onClearSearchFor={this.handleClearSearchFor}
                      onUpdateLayerProp={this.handleUpdateLayerProp}
                      onUpdateMetaProp={this.handleUpdateMetaProp}
                      visAktiveLag={context.visAktiveLag}
                      onToggleAktiveLag={context.onToggleAktiveLag}
                    />
                  </div>
                )}
                <Kart
                  bounds={this.state.fitBounds}
                  latitude={65.4}
                  longitude={10.8}
                  zoom={3}
                  aktiveLag={this.state.aktiveLag}
                  opplystKode={this.state.opplystKode}
                  meta={this.state.meta}
                  onMapBoundsChange={this.handleActualBoundsChange}
                  onMapMove={context.onMapMove}
                  onClick={latlng => {
                    history.push(`?lng=${latlng.lng}&lat=${latlng.lat}`);
                  }}
                />
              </div>
              <MobileNavigation />
            </>
          );
        }}
      </SettingsContext.Consumer>
    );
  }

  handleMouseEnter = kode => {
    this.setState({ opplystKode: kode });
  };

  handleMouseLeave = kode => {
    this.setState({ opplystKode: "" });
  };

  static contextType = SettingsContext;
}

export default withStyles(styles)(withRouter(Grunnkart));
