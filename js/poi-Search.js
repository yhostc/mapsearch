// JavaScript Document
searchCate.poi = function(){
	var a = [];
	a.push("<div class=\"Partion pt\"><div class=\"head\"></div><p></p></div>");
	a.push("<div class=\"Category pt\"><div class=\"head\"></div><p></p></div>");
	a.push("<div class=\"line\"></div>");
	a.push("<div class=\"result\"></div>");
	a.push("<div class=\"page\">");
	a.push("<a href=\"javascript:void(0)\"><img title=\"上一页\" class=\"page-start\" src=\"images/blank.gif\"/></a>");
	a.push("<a href=\"javascript:void(0)\"><img tilte=\"下一页\" class=\"page-end\" src=\"images/blank.gif\"/></a>");
	a.push("</div>");
	$(".ct-poi").html(a.join(""));
	//IP定位用户位置
	this.partion("Partion","中国");//加载行政区划
	this.partion("Category");//加载数据查询分类
	//分页
	$(".page>a").click(function(){
		$(this).blur();
	});
	
	//动态监控行政区划
	map.bind(map,"dragend",function(){
		ditu.poi.ajaxPartion();
	},"system");
	map.bind(map,"zoomchange",function(){
		ditu.poi.ajaxPartion();
	},"system");
	this.ajaxPartion();
};
searchCate.poi.prototype = {
	//分页指针
	page:1,
	//POI信息查询
	search:function(page){
		searchType = "poi";
		var k = $.trim($("input.k").val()),self=this;
		page = page?page:1;
		_page = page;
		if(!k){return false;}
		var c = $(".Partion>div").find("a:last").text();
		var d = $(".Category>div").find("a:last").text();
		$.ajax({type:"POST",dataType:"json",
			data:{c:(c!="中国"?c:"total"), d:(d!="分类"?d:""),k:k,p:page},
			url:"c.php/Server/search",
			success:function(data){
				//错误处理
				if(!data.status){
					var a = [];
					a.push("<p style=\"padding:0 20px;\">未查询到有关<b>"+k+"</b>的信息或地点。</p>");
					a.push("<p style=\"padding:0 20px;\">建议您：</p>");
					a.push("<ul class=\"info\">");
					a.push("<li>尝试更改查询限定条件</li>");
					a.push("<li>尝试不同的关键词</li>");
					a.push("<li>尝试换一种表达方式</li>");
					a.push("</ul>");
					$(".ct:eq(0)>div[class=result]").html(a.join(""));
					return void(0);
				}
				$(".ct:eq(0)>div[class=result]").html("");
				//结果输出
				self.remove();
				switch(data.type){
					case "POI":
						self.poiResult(data);break;
					case "VICINITY":
						self.vicinityResult(data);break;
					case "BUS":
						self.busResult(data);break;
					case "BUSLINE":
						self.buslineResult(data.list);break;
					case "ROAD":
						self.roadResult(data.list);break;
					case "GEOCODE":
						self.geocodeResult(data.list);break;
					case "AREA":
						self.areaResult(data.list);break;
					default:
						break;
				}
				//分页
				if(data.count>10){
					$(".page").show().find("a").eq(0).unbind("click").click(function(){//前一页
						if(page-1>0){self.search(page-1);}
					}).end().eq(1).unbind("click").click(function(){//后一页
						if(page+1<Math.ceil(data.count/10)){self.search(page+1);}
					});
				}else{
					$(".page").hide();
				}
			}
		});
	},
	outsearch:function(k,c,d,page){
		searchType = "poi";
		self=this;
		page = page?page:1;
		_page = page;
		if(!k){return false;}
		$.ajax({type:"POST",dataType:"json",
			data:{c:(c!="中国"?c:"total"), d:(d!="分类"?d:""),k:k,p:page},
			url:"c.php/Server/search",
			success:function(data){
				//错误处理
				if(!data.status){
					var a = [];
					a.push("<p style=\"padding:0 20px;\">未查询到有关<b>"+k+"</b>的信息或地点。</p>");
					a.push("<p style=\"padding:0 20px;\">建议您：</p>");
					a.push("<ul class=\"info\">");
					a.push("<li>尝试更改查询限定条件</li>");
					a.push("<li>尝试不同的关键词</li>");
					a.push("<li>尝试换一种表达方式</li>");
					a.push("</ul>");
					$(".ct:eq(0)>div[class=result]").html(a.join(""));
					return void(0);
				}
				$(".ct:eq(0)>div[class=result]").html("");
				//结果输出
				self.remove();
				switch(data.type){
					case "POI":
						self.poiResult(data);break;
					case "VICINITY":
						self.vicinityResult(data);break;
					case "BUS":
						self.busResult(data);break;
					case "BUSLINE":
						self.buslineResult(data.list);break;
					case "ROAD":
						self.roadResult(data.list);break;
					case "GEOCODE":
						self.geocodeResult(data.list);break;
					case "AREA":
						self.areaResult(data.list);break;
					default:
						break;
				}
				//分页
				if(data.count>10){
					$(".page").show().find("a").eq(0).unbind("click").click(function(){//前一页
						if(page-1>0){self.search(page-1);}
					}).end().eq(1).unbind("click").click(function(){//后一页
						if(page+1<Math.ceil(data.count/10)){self.search(page+1);}
					});
				}else{
					$(".page").hide();
				}
			}
		});
	},
	poiResult:function(data){
		var a=[],self=this,list=data.list;
		for(var i=0;i<list.length;i++){
			a.push("<div class=\"poi-m\" pguid=\""+list[i].pguid+"\">");
			a.push("<div class=\"poi-i\"><img style=\"margin-top:-"+((i+1)*26)+"px\" src=\"images/icon.png\"></div>");
			a.push("<div class=\"poi-c\"><a href=\"javascript:void(0)\" class=\"poi-n\">"+list[i].name+"</a><br/>");
			var e = []
			if(list[i].tel){
				e.push("<b>电话:</b>&nbsp;"+list[i].tel);
			}
			if(list[i].address){
				e.push("<b>地址:</b>&nbsp;"+list[i].address);
			}
			if(list[i].type){
				e.push("<b>类别:</b>&nbsp;"+list[i].type);
			}
			a.push(e.join("<br/>"));
			a.push("</div>");
			a.push("<div class=\"clear\"></div>");
			a.push("</div>");
			this.reslove(list[i].pguid,list[i].x,list[i].y,i);
		}
		$(".ct:eq(0)>div[class=result]").html(a.join(""));
		$(".poi-m").hover(function(){
			map.trigger(self.evt[$(this).attr("pguid")].obj,"mouseover");
		},function(){
			map.trigger(self.evt[$(this).attr("pguid")].obj,"mouseout");
		}).click(function(){
			self.openInfoWindow($(this).attr("pguid"),true);
		});
		map.setFitView();
		/* */
		//当数量超过1000，则增加海量点图层叠加
		map.removeLayer("mass");
		if(data.mass){
			var mass = new AMap.TileLayer({
				id:"mass",
				zIndex:2,
				getTileUrl:function(x,y,z){
					return "c.php/Tiles?x="+x+"&y="+y+"&z="+z+"&t="+data.mass;
					//return "c.php/Mre?x="+x+"&y="+y+"&z="+z+"&t="+data.mass;
				}
			});
			map.addLayer(mass);
			
			var hot = function(e){
				$.getScript("js/Hotspot.js",function(e){
					var link = location.href.split('?');
					url = 'c.php/Tiles/hotspot?file='+data.mass;
					hotspot = new Hotspot(map,url,false);
				});
			};
			map.bind(mass,"complete",hot);
		}
	},
	vicinityResult:function(data){
		var a=[],self=this,list=data.list;
		for(var i=0;i<list.length;i++){
			a.push("<div class=\"poi-m\" pguid=\""+list[i].pguid+"\">");
			a.push("<div class=\"poi-i\"><img style=\"margin-top:-"+((i+1)*26)+"px\" src=\"images/icon.png\"></div>");
			a.push("<div class=\"poi-c\"><a href=\"javascript:void(0)\" class=\"poi-n\">"+list[i].name+"</a><br/>");
			var e = []
			if(list[i].tel){
				e.push("<b>电话:</b>&nbsp;"+list[i].tel);
			}
			if(list[i].address){
				e.push("<b>地址:</b>&nbsp;"+list[i].address);
			}
			if(list[i].type){
				e.push("<b>类别:</b>&nbsp;"+list[i].type);
			}
			a.push(e.join("<br/>"));
			a.push("</div>");
			a.push("<div class=\"clear\"></div>");
			a.push("</div>");
			this.reslove(list[i].pguid,list[i].x,list[i].y,i);
		}
		$(".ct:eq(0)>div[class=result]").html(a.join(""));
		$(".poi-m").hover(function(){
			map.trigger(self.evt[$(this).attr("pguid")].obj,"mouseover");
		},function(){
			map.trigger(self.evt[$(this).attr("pguid")].obj,"mouseout");
		}).click(function(){
			self.openInfoWindow($(this).attr("pguid"),true);
		});
		map.setFitView();
		/* */
	},
	busResult:function(data){
		var a=[],self=this,list=data.list;
		a.push("<div class=\"poi-m\" pguid=\""+list.pguid+"\">");
		a.push("<div class=\"poi-i\"><img style=\"margin-top:-26px\" src=\"images/icon.png\"></div>");
		a.push("<div class=\"poi-c\"><a href=\"javascript:void(0)\" class=\"poi-n\">"+list.name+"</a><br/>");
		var e = []
		if(list.name){
			e.push("<b>站点名:</b>&nbsp;"+list.name);
		}
		if(list.type){
			e.push("<b>站点类型:</b>&nbsp;"+list.type);
		}
		if(list.lines){
			e.push("<b>途经公交:</b>&nbsp;"+list.lines);
		}
		a.push(e.join("<br/>"));
		a.push("</div>");
		a.push("<div class=\"clear\"></div>");
		a.push("</div>");
		
		this.reslove(list.pguid,list.x,list.y,0);

		$(".ct:eq(0)>div[class=result]").html(a.join(""));
		$(".poi-m").hover(function(){
			map.trigger(self.evt[$(this).attr("pguid")].obj,"mouseover");
		},function(){
			map.trigger(self.evt[$(this).attr("pguid")].obj,"mouseout");
		}).click(function(){
			self.openInfoWindow($(this).attr("pguid"),true);
		});
		map.setFitView();
	},
	buslineResult:function(list){
		var ul = [],self=this;
		//绘制公交路线
		for(var i=0;i<list.length;i++){
			var bus = list[i],path=[];
			this.reslovePolyline(bus);
			ul.push("<div class=\"poi-m\" busid=\""+bus.id+"\">");
			ul.push("<div class=\"poi-i\"><img style=\"margin-top:-"+((i+1)*26)+"px\" src=\"images/icon.png\"></div>");
			ul.push("<div class=\"poi-c\"><a href=\"javascript:void(0)\" class=\"poi-n\">"+bus.name+"</a><br/>");
			ul.push("<b>运营时间:</b>&nbsp;"+bus.start_time+" - "+bus.end_time+"<br/>");
			ul.push("<b>票价范围:</b>&nbsp;"+bus.basic_price+" - "+bus.total_price+" 元<br/>");
			ul.push("<b>行驶里程:</b>&nbsp;"+bus.length.toFixed(2)+" 公里<br/>");
			ul.push(bus.company);
			ul.push("</div>");
			ul.push("<div class=\"clear\"></div>");
			ul.push("</div>");
		}
		map.setFitView();
		$(".ct:eq(0)>div[class=result]").html(ul.join(""));
		$(".poi-m").hover(function(){
			map.trigger(self.evt[$(this).attr("busid")].obj,"mouseover");
		},function(){
			map.trigger(self.evt[$(this).attr("busid")].obj,"mouseout");
		});
	},
	roadResult:function(list){
		var ul = [];
		//绘制公交路线
		for(var i=0;i<list.length;i++){
			var road = list[i],path=[],len=0;
			for(var j=0;j<road.coords.length;j++){
				var xy = road.coords[j].split(",");
				path.push(new AMap.LngLat(xy[0],xy[1]));
				if(j == 1){
					var lng = xy[0];
					var lat = xy[1];
				}
			}
			for(var k=0;k<path.length-1;k++){
				len += parseFloat(map.getDistance(path[k],path[k+1]));
			}
			ul.push("<div class=\"poi-m\" roadid=\""+road.id+"\">");
			ul.push("<div class=\"poi-i\"><img style=\"margin-top:-"+((i+1)*26)+"px\" src=\"images/icon.png\"></div>");
			ul.push("<div class=\"poi-c\"><a href=\"javascript:void(0)\" class=\"poi-n\">"+road.name+"</a><br/>");
			ul.push("<b>道路宽度:</b>&nbsp;"+road.width+" 米<br/>");
			ul.push("<b>道路全长:</b>&nbsp;"+len.toFixed(2)+" 米<br/>");
			ul.push("</div>");
			ul.push("<div class=\"clear\"></div>");
			ul.push("</div>");
			//this.reslove(road.id,path[0].lng,path[0].lat,i);
		}
		
		this.reslove(road.id,lng,lat,0);
		
		map.addOverlays(marker);//将点添加到地图*/
		
		//调整视野到合适的位置及级别
		map.setFitView();
		
		$(".ct:eq(0)>div[class=result]").html(ul.join(""));
/*		$(".poi-m").hover(function(){
			map.trigger(self.evt[$(this).attr("roadid")].obj,"mouseover");
		},function(){
			map.trigger(self.evt[$(this).attr("roadid")].obj,"mouseout");
		});*/
	},
	geocodeResult:function(list){
		var a = [],id=AMap.Util.guid();
		a.push("<div class=\"poi-m\" pguid=\""+id+"\">");
		a.push("<div class=\"poi-i\"><img style=\"margin-top:-26px\" src=\"images/icon.png\"></div>");
		a.push("<div class=\"poi-c\"><a href=\"javascript:void(0)\" class=\"poi-n\">"+list.name+"</a><br/>");
		if(list.address){
			a.push("<b>地址：</b>&nbsp;"+list.address);
		}
		a.push("</div>");
		a.push("<div class=\"clear\"></div>");
		a.push("</div>");
		$(".ct:eq(0)>div[class=result]").html(a.join(""));
		$(".poi-m").click(function(){
			map.trigger(self.evt[$(this).attr("pguid")].obj,"click");
		});
		
		var m = document.createElement("div");
		m.style.cssText = "width:30px;height:26px;overflow:hidden;";
		var n = document.createElement("img");
		n.style.marginTop = -26+"px";
		n.src = "images/icon.png";
		m.appendChild(n);
		//添加行政中心点
		var marker = new AMap.Marker({
			id:id,
			zIndex:2,
			position:new AMap.LngLat(list.x,list.y),//基点位置
			offset:new AMap.Pixel(-13,-26),//相对于基点的位置
			content:m
		});
		map.addOverlays(marker);
		map.setFitView();
		var t = [];
		t.push("<div class=\"info-n\">"+list.name+"</div>");
		t.push("&nbsp;<span>地址</span>："+list.address+"<br/>");
		t.push("</div>");
		var infowindow = new AMap.InfoWindow({
			size:new AMap.Size(250,0),
			offset:new AMap.Pixel(-78,-88),
			autoMove:false,
			content:t.join("")
		});
		
		var mo = function(){
			marker.setzIndex(5);
			n.style.marginLeft = "-30px";
		};
		map.bind(marker,"mouseover",mo);
		var mu = function(){
			marker.setzIndex(2);
			n.style.marginLeft = "0";
		};
		var self = this;
		map.bind(marker,"mouseout",mu);
		var cl = function(){
			infowindow.open(map,marker.getPosition());
		};
		map.bind(marker,"click",cl);
		
		this.evt[id] = {
			obj:marker,
			evt:[{n:"mouseover",f:mo},{n:"mouseout",f:mu},{n:"click",f:cl}]
		};
	},
	areaResult:function(list){//展示行政区划数据
		var adcode = list.adcode;
		var Polictic = new AMap.TileLayer({
			id:"polictic",//图层唯一ID
			zIndex:2,
			opacity:0.7,
			tileUrl:"http://172.17.41.241:8001/gettile.py?userId=100000&z=[z]&x=[x]&y=[y]&areacode="+adcode+"&areacolor=FF9999&areaoutlinecolor=FF00FF"
		});
		this.remove();
		map.setCenter(new AMap.LngLat(list.x,list.y));
		map.addLayer(Polictic);
		map.setZoom(10);
	},
	//当前地图上的覆盖物
	evt:{},
	//标注覆盖物
	reslove:function(id,x,y,i){
		var m = document.createElement("div");
		m.style.cssText = "width:30px;height:26px;overflow:hidden;";
		var n = document.createElement("img");
		n.style.marginTop = -(26*(i+1))+"px";
		n.src = "images/icon.png";
		m.appendChild(n);
		
		//添加行政中心点
		var marker = new AMap.Marker({
			id:id,
			zIndex:2,
			position:new AMap.LngLat(x,y),//基点位置
			offset:new AMap.Pixel(-13,-26),//相对于基点的位置
			content:m
		});
		map.addOverlays(marker);
		var mo = function(){
			marker.setzIndex(5);
			n.style.marginLeft = "-30px";
		};
		map.bind(marker,"mouseover",mo);
		var mu = function(){
			marker.setzIndex(2);
			n.style.marginLeft = "0";
		};
		var self = this;
		map.bind(marker,"mouseout",mu);
		var cl = function(){
			self.openInfoWindow(id);
		};
		map.bind(marker,"click",cl);
		
		this.evt[id] = {
			obj:marker,
			evt:[{n:"mouseover",f:mo},{n:"mouseout",f:mu},{n:"click",f:cl}]
		};
	},
	reslovePolyline:function(bus){
		var path = [];
		for(var j=0;j<bus.coords.length;j++){
			var xy = bus.coords[j].split(",");
			path.push(new AMap.LngLat(xy[0],xy[1]));
		}
		var polyline = new AMap.Polyline({
			id:bus.id,
			path:path,
			strokeColor:"#1791fc",
			strokeOpacity:0.5,
			strokeWeight:5,
			zIndex:1
		});
		map.addOverlays(polyline);
		var mo = function(){
			polyline.setOptions({strokeColor:"#F00",strokeOpacity:0.75,zIndex:999});
		};
		map.bind(polyline,"mouseover",mo);
		var mu = function(){
			polyline.setOptions({strokeColor:"#1791fc",strokeOpacity:0.5,zIndex:1});
		};
		map.bind(polyline,"mouseout",mu);
		this.evt[bus.id] = {
			obj:polyline,
			evt:[{n:"mouseover",f:mo},{n:"mouseout",f:mu}]
		};
	},
	//删除添加的所有覆盖物和绑定到事件
	remove:function(){
		for(var i in this.evt){
			var a = this.evt[i];
			for(var j=0;j<a.evt.length;j++){
				map.unbind(a.obj,a.evt[j].n,a.evt[j].f);
			}
			map.removeOverlays(a.obj);
		}
		this.evt = {};
		//清空信息窗体
		map.clearInfoWindow();
		map.removeLayer('polictic');
		map.removeLayer("mass");
	},
	//根据PGUID打开信息窗体
	infowindow:null,
	openInfoWindow:function(id,m){
		var self = this;
		if(!this.infowindow){//定义信息窗体
			this.infowindow = new AMap.InfoWindow({
				size:new AMap.Size(250,0),
				offset:new AMap.Pixel(-78,-88),
				autoMove:false,
				content:""
			});
		}
		this.infowindow.autoMove = m?false:true;
		$.ajax({type:"POST",dataType:"json",data:{id:id},url:"c.php/Server/getPoiInfo",success:function(data){
			if(!data.status){alert(data.info);}
			var t = [],p = data.list;
			if(m){//是否需要移动到地图中心
				map.panTo(new AMap.LngLat(p.x,p.y));
			}
			t.push("<div class=\"info-n\">"+p.name+"</div>");
			t.push("<div class=\"info-c\"><span>电话</span>："+(p.tel?p.tel:"暂无")+"<br/>");
			t.push("<span>地址</span>："+p.address+"<br/>");
			t.push("</div>");
			self.infowindow.setContent(t.join(""));
			self.infowindow.open(map,new AMap.LngLat(p.x,p.y));
		}});
	},
	//获取当前地图行政区划
	ajaxPartion:function(){
		var self = this;
		var xy = map.getCenter();
		$.ajax({type:"POST",dataType:"json",data:{x:xy.lng,y:xy.lat,l:map.getZoom()},url:"c.php/Partion/",success:function(partion){
			var par = partion[partion.length-1];
			if($(".Partion>div").find("a:last").text() != partion[partion.length-1]){
				self.partion("Partion",partion[partion.length-1]);//加载行政区划
			}
		}});
	},
	//获取下级区划数据
	partion:function(cate,n){
		var self = this;
		$.ajax({type:"POST",dataType:"json",data:{n:n},url:"c.php/"+cate+"/getChildren",success:function(data){
			if(!data.status){alert(data.info);}
			$("div."+cate).addClass("pa");
			//当前路径
			var b = [];
			for(var j=0;j<data.partion.length;j++){
				b.push("<a href=\"javascript:void(0)\">"+data.partion[j]+"</a>");
			}
			$("div."+cate+">div").html("<img src=\"images/blank.gif\"/>"+b.join(">&nbsp;"));
			$("div."+cate+">div>a:last").addClass("un");
			//下级分类
			var a = [];
			if(data.data){//如果有下级
				for(var i=0;i<data.data.length;i++){//下级信息
					a.push("<a href=\"javascript:void(0)\">"+data.data[i].name+"</a>");
				}
			}
			$("div."+cate+">p").html(a.join("")).show();
			//链接处理
			$("div."+cate).find("a").click(function(){
				$(this).blur();
				map.setCity($(this).text());
				self.partion(cate,$(this).text());
				//self.search();//重新查询
			});
			//折叠处理
			$("div."+cate+">div>img").click(function(){
				$(this).parent().parent().toggleClass("pa");
				$(this).parent().next().toggleClass("show");
				if($(this).parent().parent().hasClass("pa")){
					$("div."+cate+">div>a:last").addClass("un");
				}else{
					$("div."+cate+">div>a:last").removeClass("un");
				}
			});
			if(cate=="Category"){
				$("div."+cate+">div>img").click();
			}
		}});
	}
};