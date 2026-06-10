/**
 * Phase 2: Update Master words.json
 * - 53 dup replacements across 28 topics
 * - 44 word additions to 19 short topics
 * - Total: 356 → 400 words, 303 → 400 unique
 */

const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '../data/words.json');
const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const master = data['master'];

// ─── New word objects ────────────────────────────────────────────────────────

const W = {
  // academic-skills
  reasoning: { word:'reasoning', meaning:'lập luận / tư duy', emoji:'🧠', class:'n', examples:[
    {en:'Sound reasoning is the foundation of any persuasive academic argument.',vi:'Lập luận vững chắc là nền tảng của mọi luận điểm học thuật thuyết phục.'},
    {en:'Critical reasoning skills help students evaluate sources and question assumptions.',vi:'Kỹ năng tư duy phản biện giúp học sinh đánh giá nguồn tư liệu và đặt câu hỏi về các giả định.'}]},
  // law-justice
  indictment: { word:'indictment', meaning:'cáo trạng', emoji:'📜', class:'n', examples:[
    {en:'The grand jury issued an indictment against the executive on charges of fraud.',vi:'Bồi thẩm đoàn đại hình đã ban hành cáo trạng chống lại vị giám đốc điều hành với tội danh gian lận.'},
    {en:'An indictment does not establish guilt but initiates the formal trial process.',vi:'Cáo trạng không xác lập tội lỗi nhưng khởi tố quá trình xét xử chính thức.'}]},
  extradition: { word:'extradition', meaning:'dẫn độ', emoji:'✈️', class:'n', examples:[
    {en:'The suspect fled abroad but was returned via an extradition treaty.',vi:'Nghi phạm trốn ra nước ngoài nhưng đã được đưa về thông qua hiệp ước dẫn độ.'},
    {en:'Extradition proceedings can take months when multiple legal systems are involved.',vi:'Thủ tục dẫn độ có thể mất nhiều tháng khi liên quan đến nhiều hệ thống pháp luật.'}]},
  // education-system
  differentiation: { word:'differentiation', meaning:'phân hóa dạy học', emoji:'🎓', class:'n', examples:[
    {en:'Effective differentiation allows teachers to meet the needs of every learner in a mixed-ability class.',vi:'Phân hóa dạy học hiệu quả giúp giáo viên đáp ứng nhu cầu của mọi học sinh trong lớp đa trình độ.'},
    {en:'Curriculum differentiation has become a key principle in modern inclusive education.',vi:'Phân hóa chương trình đã trở thành nguyên tắc then chốt trong giáo dục hòa nhập hiện đại.'}]},
  // food-agriculture
  food_security: { word:'food security', meaning:'an ninh lương thực', emoji:'🌾', class:'n', examples:[
    {en:'Climate change poses a significant threat to global food security.',vi:'Biến đổi khí hậu đặt ra mối đe dọa đáng kể đối với an ninh lương thực toàn cầu.'},
    {en:'Governments invest in agricultural research to strengthen long-term food security.',vi:'Các chính phủ đầu tư vào nghiên cứu nông nghiệp để tăng cường an ninh lương thực dài hạn.'}]},
  // language-communication
  register: { word:'register', meaning:'phong cách ngôn ngữ / ngữ điệu', emoji:'🗣️', class:'n', examples:[
    {en:'Choosing the appropriate register is essential in both spoken and written communication.',vi:'Lựa chọn phong cách ngôn ngữ phù hợp là điều thiết yếu trong cả giao tiếp nói và viết.'},
    {en:'Academic writing demands a formal register that differs significantly from everyday speech.',vi:'Văn phong học thuật đòi hỏi ngữ điệu trang trọng khác biệt đáng kể so với ngôn ngữ hàng ngày.'}]},
  // philosophy-ethics
  axiom: { word:'axiom', meaning:'tiên đề / nguyên lý hiển nhiên', emoji:'📐', class:'n', examples:[
    {en:'It is an axiom of democratic theory that political power derives from the consent of the governed.',vi:'Đây là tiên đề của lý thuyết dân chủ rằng quyền lực chính trị xuất phát từ sự đồng thuận của người bị cai trị.'},
    {en:'Philosophers debate whether moral axioms are universal or culturally contingent.',vi:'Các triết gia tranh luận liệu các tiên đề đạo đức có phổ quát hay phụ thuộc vào văn hóa.'}]},
  deontology: { word:'deontology', meaning:'đạo đức học nghĩa vụ', emoji:'⚖️', class:'n', examples:[
    {en:'Deontology holds that the morality of an action is determined by rules, not by its consequences.',vi:'Đạo đức học nghĩa vụ cho rằng tính đạo đức của một hành động được xác định bởi các quy tắc, không phải hậu quả.'},
    {en:'Kant\'s deontology argues that lying is always wrong regardless of the outcome.',vi:'Đạo đức học nghĩa vụ của Kant cho rằng nói dối luôn sai bất kể hậu quả là gì.'}]},
  epistemology: { word:'epistemology', meaning:'nhận thức luận', emoji:'🔍', class:'n', examples:[
    {en:'Epistemology examines the nature, sources, and limits of human knowledge.',vi:'Nhận thức luận xem xét bản chất, nguồn gốc và giới hạn của tri thức con người.'},
    {en:'A central question in epistemology is whether we can ever have certainty about the external world.',vi:'Một câu hỏi trung tâm trong nhận thức luận là liệu chúng ta có thể chắc chắn về thế giới bên ngoài hay không.'}]},
  // constitutional-law
  impeachment: { word:'impeachment', meaning:'luận tội', emoji:'🏛️', class:'n', examples:[
    {en:'The impeachment of a president requires a vote in the lower house of parliament.',vi:'Việc luận tội một tổng thống đòi hỏi phải có phiếu bầu tại hạ viện nghị viện.'},
    {en:'Impeachment proceedings serve as a constitutional check on executive power.',vi:'Thủ tục luận tội đóng vai trò kiểm soát hiến pháp đối với quyền lực hành pháp.'}]},
  habeas_corpus: { word:'habeas corpus', meaning:'lệnh habeas corpus (quyền ra tòa)', emoji:'📋', class:'n', examples:[
    {en:'Habeas corpus protects individuals from unlawful detention by requiring courts to review imprisonment.',vi:'Habeas corpus bảo vệ cá nhân khỏi bị giam giữ trái pháp luật bằng cách yêu cầu tòa án xem xét việc giam giữ.'},
    {en:'The suspension of habeas corpus is considered a fundamental threat to civil liberties.',vi:'Việc đình chỉ habeas corpus được coi là mối đe dọa cơ bản đối với các quyền tự do dân sự.'}]},
  // environmental-governance
  stewardship: { word:'stewardship', meaning:'quản lý / bảo tồn môi trường', emoji:'🌿', class:'n', examples:[
    {en:'Environmental stewardship requires balancing economic development with ecological responsibility.',vi:'Bảo tồn môi trường đòi hỏi cân bằng giữa phát triển kinh tế và trách nhiệm sinh thái.'},
    {en:'The national park was praised for its stewardship of protected landscapes.',vi:'Vườn quốc gia được khen ngợi vì việc quản lý các cảnh quan được bảo vệ.'}]},
  directive: { word:'directive', meaning:'chỉ thị / quy định', emoji:'📑', class:'n', examples:[
    {en:'The EU issued a directive requiring member states to reduce single-use plastics.',vi:'EU đã ban hành chỉ thị yêu cầu các quốc gia thành viên giảm đồ nhựa dùng một lần.'},
    {en:'Environmental directives set binding targets that governments must meet by specified deadlines.',vi:'Các chỉ thị môi trường đặt ra các mục tiêu ràng buộc mà các chính phủ phải đáp ứng theo thời hạn quy định.'}]},
  decarbonize: { word:'decarbonize', meaning:'khử carbon', emoji:'🌱', class:'v', examples:[
    {en:'Many countries have pledged to decarbonize their energy sectors by 2050.',vi:'Nhiều quốc gia đã cam kết khử carbon trong các lĩnh vực năng lượng của họ vào năm 2050.'},
    {en:'Decarbonizing heavy industry remains one of the most technically challenging aspects of climate action.',vi:'Khử carbon trong công nghiệp nặng vẫn là một trong những khía cạnh kỹ thuật khó khăn nhất của hành động khí hậu.'}]},
  // political-philosophy
  constitutionalism: { word:'constitutionalism', meaning:'chủ nghĩa hợp hiến', emoji:'📜', class:'n', examples:[
    {en:'Constitutionalism limits the exercise of government power through enforceable legal norms.',vi:'Chủ nghĩa hợp hiến hạn chế việc thực thi quyền lực nhà nước thông qua các chuẩn mực pháp lý có thể thực thi.'},
    {en:'The rise of populism has been seen as a challenge to constitutionalism in several democracies.',vi:'Sự trỗi dậy của chủ nghĩa dân túy được xem là thách thức đối với chủ nghĩa hợp hiến ở một số nền dân chủ.'}]},
  coercion: { word:'coercion', meaning:'sự ép buộc', emoji:'🔒', class:'n', examples:[
    {en:'The use of coercion to suppress political opposition undermines democratic principles.',vi:'Việc sử dụng ép buộc để đàn áp phe đối lập chính trị làm suy yếu các nguyên tắc dân chủ.'},
    {en:'International law prohibits the coercion of states through military or economic pressure.',vi:'Luật quốc tế cấm ép buộc các quốc gia thông qua áp lực quân sự hoặc kinh tế.'}]},
  federalism: { word:'federalism', meaning:'chủ nghĩa liên bang', emoji:'🗺️', class:'n', examples:[
    {en:'Federalism distributes power between a central government and regional authorities.',vi:'Chủ nghĩa liên bang phân phối quyền lực giữa chính quyền trung ương và các cơ quan địa phương.'},
    {en:'The debate over federalism reflects tension between national unity and local autonomy.',vi:'Cuộc tranh luận về chủ nghĩa liên bang phản ánh sự căng thẳng giữa thống nhất quốc gia và quyền tự trị địa phương.'}]},
  social_contract: { word:'social contract', meaning:'khế ước xã hội', emoji:'🤝', class:'n', examples:[
    {en:'Rousseau\'s social contract theory argues that political authority rests on the consent of citizens.',vi:'Lý thuyết khế ước xã hội của Rousseau lập luận rằng quyền lực chính trị dựa trên sự đồng thuận của công dân.'},
    {en:'Rising inequality has led many to question whether the social contract is still functioning.',vi:'Bất bình đẳng gia tăng đã khiến nhiều người đặt câu hỏi liệu khế ước xã hội có còn hoạt động hay không.'}]},
  // public-policy
  oversight: { word:'oversight', meaning:'giám sát', emoji:'👁️', class:'n', examples:[
    {en:'Independent oversight of public institutions is essential to prevent corruption.',vi:'Giám sát độc lập đối với các thể chế công là điều cần thiết để ngăn chặn tham nhũng.'},
    {en:'Parliamentary oversight ensures that government spending is accountable to the public.',vi:'Giám sát của nghị viện đảm bảo rằng chi tiêu chính phủ có trách nhiệm với công chúng.'}]},
  constituency: { word:'constituency', meaning:'khu vực bầu cử / cử tri', emoji:'🗳️', class:'n', examples:[
    {en:'The politician pledged to represent every member of her constituency equally.',vi:'Chính trị gia cam kết đại diện bình đẳng cho mọi thành viên trong khu vực bầu cử của bà.'},
    {en:'Policy-makers must balance the interests of multiple constituencies with competing demands.',vi:'Các nhà hoạch định chính sách phải cân bằng lợi ích của nhiều nhóm cử tri với những yêu cầu cạnh tranh.'}]},
  lobbying: { word:'lobbying', meaning:'vận động hành lang', emoji:'🏛️', class:'n', examples:[
    {en:'Lobbying allows interest groups to influence legislation, but critics argue it distorts democracy.',vi:'Vận động hành lang cho phép các nhóm lợi ích tác động đến pháp luật, nhưng các nhà phê bình cho rằng nó bóp méo dân chủ.'},
    {en:'Transparency laws require organisations to disclose their lobbying activities.',vi:'Luật minh bạch yêu cầu các tổ chức công khai hoạt động vận động hành lang của họ.'}]},
  mandate: { word:'mandate', meaning:'ủy quyền / nhiệm vụ bắt buộc', emoji:'📋', class:'n', examples:[
    {en:'The government received a clear electoral mandate to reform the healthcare system.',vi:'Chính phủ nhận được ủy quyền bầu cử rõ ràng để cải cách hệ thống chăm sóc sức khỏe.'},
    {en:'A regulatory mandate requires all new buildings to meet minimum energy efficiency standards.',vi:'Nhiệm vụ quy định yêu cầu tất cả các tòa nhà mới phải đáp ứng tiêu chuẩn hiệu quả năng lượng tối thiểu.'}]},
  // academic-discourse
  proposition: { word:'proposition', meaning:'mệnh đề / luận điểm', emoji:'💬', class:'n', examples:[
    {en:'The central proposition of the paper is that economic growth and equality are not incompatible.',vi:'Mệnh đề trung tâm của bài viết là tăng trưởng kinh tế và bình đẳng không mâu thuẫn nhau.'},
    {en:'A well-supported proposition requires both empirical evidence and logical reasoning.',vi:'Một mệnh đề được hỗ trợ tốt đòi hỏi cả bằng chứng thực nghiệm lẫn lập luận logic.'}]},
  dissemination: { word:'dissemination', meaning:'phổ biến / lan truyền thông tin', emoji:'📢', class:'n', examples:[
    {en:'Open-access publishing has transformed the dissemination of academic research.',vi:'Xuất bản truy cập mở đã thay đổi việc phổ biến nghiên cứu học thuật.'},
    {en:'The dissemination of findings to policymakers is as important as the research itself.',vi:'Phổ biến kết quả nghiên cứu cho các nhà hoạch định chính sách cũng quan trọng như bản thân nghiên cứu.'}]},
  attribution: { word:'attribution', meaning:'ghi nhận nguồn / quy gán', emoji:'🔗', class:'n', examples:[
    {en:'Proper attribution acknowledges the intellectual contributions of previous scholars.',vi:'Ghi nhận nguồn đúng cách thừa nhận đóng góp trí tuệ của các học giả trước.'},
    {en:'Failure to provide accurate attribution in academic work constitutes plagiarism.',vi:'Việc không ghi nhận nguồn chính xác trong công trình học thuật cấu thành đạo văn.'}]},
  framework: { word:'framework', meaning:'khung lý thuyết / phương pháp tiếp cận', emoji:'🏗️', class:'n', examples:[
    {en:'The study adopts a sociological framework to analyse patterns of urban migration.',vi:'Nghiên cứu áp dụng khung lý thuyết xã hội học để phân tích các mô hình di cư đô thị.'},
    {en:'A clear analytical framework helps researchers structure their arguments systematically.',vi:'Một khung phân tích rõ ràng giúp các nhà nghiên cứu cấu trúc luận điểm một cách có hệ thống.'}]},
  annotate: { word:'annotate', meaning:'chú thích / ghi chú', emoji:'✍️', class:'v', examples:[
    {en:'Students are encouraged to annotate primary sources as they read to track key arguments.',vi:'Học sinh được khuyến khích chú thích các nguồn tài liệu gốc khi đọc để theo dõi các luận điểm chính.'},
    {en:'An annotated bibliography includes a brief summary and evaluation of each source.',vi:'Thư mục có chú thích bao gồm tóm tắt ngắn gọn và đánh giá từng nguồn tài liệu.'}]},
  interdisciplinary: { word:'interdisciplinary', meaning:'liên ngành', emoji:'🔀', class:'adj', examples:[
    {en:'Climate change demands an interdisciplinary response drawing on science, economics and policy.',vi:'Biến đổi khí hậu đòi hỏi phản ứng liên ngành dựa trên khoa học, kinh tế và chính sách.'},
    {en:'Interdisciplinary research often produces the most innovative insights.',vi:'Nghiên cứu liên ngành thường tạo ra những hiểu biết sáng tạo nhất.'}]},
  academic_rigor: { word:'academic rigor', meaning:'tính chặt chẽ học thuật', emoji:'🎯', class:'n', examples:[
    {en:'Academic rigor demands that every claim be supported by verifiable evidence.',vi:'Tính chặt chẽ học thuật đòi hỏi mọi khẳng định phải được hỗ trợ bởi bằng chứng có thể xác minh.'},
    {en:'Peer review is the primary mechanism for ensuring academic rigor in published research.',vi:'Phản biện đồng nghiệp là cơ chế chính để đảm bảo tính chặt chẽ học thuật trong nghiên cứu được xuất bản.'}]},
  // geopolitics
  deterrence_geo: { word:'deterrence', meaning:'sự răn đe', emoji:'🚫', class:'n', examples:[
    {en:'Nuclear deterrence has shaped the strategic calculations of major powers for decades.',vi:'Răn đe hạt nhân đã định hình các tính toán chiến lược của các cường quốc trong nhiều thập kỷ.'},
    {en:'Military deterrence relies on the credibility of a nation\'s willingness to use force.',vi:'Răn đe quân sự dựa trên độ tin cậy của sự sẵn sàng sử dụng vũ lực của một quốc gia.'}]},
  sphere_of_influence: { word:'sphere of influence', meaning:'vùng ảnh hưởng', emoji:'🌐', class:'n', examples:[
    {en:'Great powers have historically sought to maintain a sphere of influence in neighbouring regions.',vi:'Các cường quốc từ trước đến nay đã cố gắng duy trì vùng ảnh hưởng ở các khu vực lân cận.'},
    {en:'Disputes over spheres of influence frequently trigger geopolitical tensions.',vi:'Tranh chấp về vùng ảnh hưởng thường xuyên gây ra căng thẳng địa chính trị.'}]},
  // macroeconomics
  stagflation: { word:'stagflation', meaning:'lạm phát đình trệ', emoji:'📉', class:'n', examples:[
    {en:'Stagflation — the combination of high inflation and economic stagnation — poses a dilemma for policymakers.',vi:'Lạm phát đình trệ — sự kết hợp của lạm phát cao và trì trệ kinh tế — đặt ra tình huống khó xử cho các nhà hoạch định chính sách.'},
    {en:'The 1970s oil crisis produced stagflation in many Western economies.',vi:'Cuộc khủng hoảng dầu mỏ những năm 1970 đã gây ra lạm phát đình trệ ở nhiều nền kinh tế phương Tây.'}]},
  quantitative_easing: { word:'quantitative easing', meaning:'nới lỏng định lượng', emoji:'💵', class:'n', examples:[
    {en:'Quantitative easing involves a central bank purchasing assets to inject money into the economy.',vi:'Nới lỏng định lượng liên quan đến việc ngân hàng trung ương mua tài sản để bơm tiền vào nền kinh tế.'},
    {en:'Critics of quantitative easing warn it can fuel asset price inflation and inequality.',vi:'Những người chỉ trích nới lỏng định lượng cảnh báo rằng nó có thể thúc đẩy lạm phát giá tài sản và bất bình đẳng.'}]},
  trade_surplus: { word:'trade surplus', meaning:'thặng dư thương mại', emoji:'📊', class:'n', examples:[
    {en:'A consistent trade surplus indicates that a country exports more than it imports.',vi:'Thặng dư thương mại nhất quán cho thấy một quốc gia xuất khẩu nhiều hơn nhập khẩu.'},
    {en:'Trade surplus countries often face political pressure to revalue their currency.',vi:'Các quốc gia có thặng dư thương mại thường đối mặt với áp lực chính trị để định giá lại đồng tiền của họ.'}]},
  // medical-ethics
  disclosure: { word:'disclosure', meaning:'công bố / tiết lộ thông tin', emoji:'📋', class:'n', examples:[
    {en:'Full disclosure of risks is a legal and ethical requirement before any medical procedure.',vi:'Công bố đầy đủ các rủi ro là yêu cầu pháp lý và đạo đức trước bất kỳ thủ thuật y tế nào.'},
    {en:'Inadequate disclosure of side effects led to a major pharmaceutical lawsuit.',vi:'Tiết lộ không đầy đủ về tác dụng phụ đã dẫn đến một vụ kiện dược phẩm lớn.'}]},
  malpractice: { word:'malpractice', meaning:'hành nghề sai chuẩn / sơ suất nghề nghiệp', emoji:'⚕️', class:'n', examples:[
    {en:'The surgeon was sued for malpractice after a preventable error during the operation.',vi:'Bác sĩ phẫu thuật đã bị kiện vì hành nghề sai chuẩn sau một lỗi có thể phòng ngừa trong ca phẫu thuật.'},
    {en:'Malpractice insurance protects healthcare professionals from personal financial liability.',vi:'Bảo hiểm sơ suất nghề nghiệp bảo vệ các chuyên gia y tế khỏi trách nhiệm tài chính cá nhân.'}]},
  placebo: { word:'placebo', meaning:'giả dược', emoji:'💊', class:'n', examples:[
    {en:'The clinical trial used a placebo control group to measure the true effect of the drug.',vi:'Thử nghiệm lâm sàng sử dụng nhóm chứng giả dược để đo lường tác dụng thực sự của thuốc.'},
    {en:'The placebo effect demonstrates the powerful influence of expectation on health outcomes.',vi:'Hiệu ứng giả dược cho thấy ảnh hưởng mạnh mẽ của kỳ vọng lên kết quả sức khỏe.'}]},
  // sociology
  stigma: { word:'stigma', meaning:'sự kỳ thị', emoji:'🚫', class:'n', examples:[
    {en:'Mental health stigma prevents many people from seeking the help they need.',vi:'Sự kỳ thị về sức khỏe tâm thần ngăn nhiều người tìm kiếm sự giúp đỡ họ cần.'},
    {en:'Campaigns to reduce stigma around addiction have helped shift public attitudes.',vi:'Các chiến dịch giảm kỳ thị xung quanh nghiện ngập đã giúp thay đổi thái độ công chúng.'}]},
  stratification: { word:'stratification', meaning:'phân tầng xã hội', emoji:'📊', class:'n', examples:[
    {en:'Social stratification refers to the hierarchical arrangement of individuals in society.',vi:'Phân tầng xã hội đề cập đến sự sắp xếp thứ bậc của các cá nhân trong xã hội.'},
    {en:'Education systems can either reinforce or challenge existing patterns of social stratification.',vi:'Các hệ thống giáo dục có thể củng cố hoặc thách thức các mô hình phân tầng xã hội hiện có.'}]},
  intersectionality: { word:'intersectionality', meaning:'giao thoa bản sắc / tính giao thoa', emoji:'🔀', class:'n', examples:[
    {en:'Intersectionality examines how overlapping identities such as race, gender and class shape experience.',vi:'Tính giao thoa xem xét cách các bản sắc chồng chéo như chủng tộc, giới tính và giai cấp định hình trải nghiệm.'},
    {en:'An intersectional approach reveals forms of discrimination that single-axis analysis may miss.',vi:'Cách tiếp cận giao thoa tiết lộ các hình thức phân biệt đối xử mà phân tích đơn trục có thể bỏ qua.'}]},
  // business-ethics
  due_diligence: { word:'due diligence', meaning:'thẩm định / kiểm tra kỹ lưỡng', emoji:'🔎', class:'n', examples:[
    {en:'Investors are expected to conduct due diligence before committing capital to any venture.',vi:'Các nhà đầu tư được kỳ vọng thực hiện thẩm định trước khi cam kết vốn vào bất kỳ dự án nào.'},
    {en:'Failure to exercise due diligence can expose a company to significant legal and reputational risk.',vi:'Không thực hiện kiểm tra kỹ lưỡng có thể khiến công ty đối mặt với rủi ro pháp lý và uy tín đáng kể.'}]},
  fiduciary: { word:'fiduciary', meaning:'ủy thác / nghĩa vụ tín thác', emoji:'🤝', class:'adj', examples:[
    {en:'Directors have a fiduciary duty to act in the best interests of shareholders.',vi:'Các giám đốc có nghĩa vụ ủy thác hành động vì lợi ích tốt nhất của các cổ đông.'},
    {en:'A breach of fiduciary responsibility can result in civil liability and personal damages.',vi:'Vi phạm trách nhiệm ủy thác có thể dẫn đến trách nhiệm dân sự và bồi thường thiệt hại cá nhân.'}]},
  // technology-ethics
  obsolescence: { word:'obsolescence', meaning:'sự lỗi thời', emoji:'🗑️', class:'n', examples:[
    {en:'Planned obsolescence is a strategy where products are designed to become outdated quickly.',vi:'Lỗi thời có kế hoạch là chiến lược thiết kế sản phẩm để trở nên lỗi thời nhanh chóng.'},
    {en:'Technological obsolescence poses challenges for industries that rely on legacy systems.',vi:'Lỗi thời công nghệ đặt ra thách thức cho các ngành dựa vào hệ thống cũ.'}]},
  metadata: { word:'metadata', meaning:'siêu dữ liệu', emoji:'🗂️', class:'n', examples:[
    {en:'Metadata about online activity can reveal as much about a person as the content itself.',vi:'Siêu dữ liệu về hoạt động trực tuyến có thể tiết lộ nhiều điều về một người như chính nội dung.'},
    {en:'Scholars use document metadata to verify authenticity and establish provenance.',vi:'Các học giả sử dụng siêu dữ liệu tài liệu để xác minh tính xác thực và thiết lập nguồn gốc.'}]},
  liability: { word:'liability', meaning:'trách nhiệm pháp lý', emoji:'⚖️', class:'n', examples:[
    {en:'Technology companies face growing liability for the harms caused by their platforms.',vi:'Các công ty công nghệ đối mặt với trách nhiệm pháp lý ngày càng tăng đối với các tác hại do nền tảng của họ gây ra.'},
    {en:'Questions of liability in AI-generated errors have yet to be resolved by courts.',vi:'Các câu hỏi về trách nhiệm pháp lý trong các lỗi do AI tạo ra vẫn chưa được tòa án giải quyết.'}]},
  deepfake: { word:'deepfake', meaning:'video/hình ảnh giả mạo bằng AI', emoji:'🤖', class:'n', examples:[
    {en:'Deepfake technology makes it increasingly difficult to distinguish real video from fabricated footage.',vi:'Công nghệ deepfake ngày càng làm khó phân biệt video thật với hình ảnh giả mạo.'},
    {en:'The spread of deepfakes raises urgent questions about consent, identity and political manipulation.',vi:'Sự lan rộng của deepfake đặt ra những câu hỏi cấp bách về sự đồng thuận, bản sắc và thao túng chính trị.'}]},
  explainability: { word:'explainability', meaning:'khả năng giải thích (của AI)', emoji:'💡', class:'n', examples:[
    {en:'Explainability in AI systems is essential when automated decisions affect people\'s lives.',vi:'Khả năng giải thích trong các hệ thống AI là điều cần thiết khi các quyết định tự động ảnh hưởng đến cuộc sống của mọi người.'},
    {en:'Regulators increasingly demand explainability as a condition for deploying AI in high-stakes domains.',vi:'Các cơ quan quản lý ngày càng yêu cầu khả năng giải thích như điều kiện để triển khai AI trong các lĩnh vực có rủi ro cao.'}]},
  // media-literacy
  disinformation: { word:'disinformation', meaning:'thông tin sai lệch có chủ ý', emoji:'❌', class:'n', examples:[
    {en:'Unlike misinformation, disinformation is deliberately crafted and spread to deceive.',vi:'Không giống thông tin sai lệch, thông tin sai lệch có chủ ý được cố tình tạo ra và lan truyền để lừa dối.'},
    {en:'State-sponsored disinformation campaigns have been documented in multiple recent elections.',vi:'Các chiến dịch thông tin sai lệch có chủ ý do nhà nước bảo trợ đã được ghi nhận trong nhiều cuộc bầu cử gần đây.'}]},
  // rhetoric-debate
  sophistry: { word:'sophistry', meaning:'ngụy biện', emoji:'🎭', class:'n', examples:[
    {en:'The politician\'s argument was dismissed by critics as sophistry rather than genuine reasoning.',vi:'Lập luận của chính trị gia bị các nhà phê bình gạt đi là ngụy biện hơn là lý luận thực sự.'},
    {en:'Sophistry uses technically valid logic to reach misleading or self-serving conclusions.',vi:'Ngụy biện sử dụng logic hợp lệ về kỹ thuật để đạt đến kết luận gây hiểu lầm hoặc phục vụ lợi ích cá nhân.'}]},
  syllogism: { word:'syllogism', meaning:'tam đoạn luận', emoji:'🔢', class:'n', examples:[
    {en:'A classic syllogism runs: all humans are mortal; Socrates is human; therefore Socrates is mortal.',vi:'Tam đoạn luận kinh điển: mọi người đều phải chết; Socrates là người; do đó Socrates phải chết.'},
    {en:'Rhetoric training often uses syllogism to teach the structure of logical deduction.',vi:'Đào tạo hùng biện thường sử dụng tam đoạn luận để dạy cấu trúc suy diễn logic.'}]},
  eloquence: { word:'eloquence', meaning:'sự hùng hồn / khéo ăn nói', emoji:'🗣️', class:'n', examples:[
    {en:'Her eloquence in the debate won over even those who had been sceptical of her position.',vi:'Sự hùng hồn của cô trong cuộc tranh luận đã thuyết phục cả những người hoài nghi về lập trường của cô.'},
    {en:'Eloquence in academic writing means expressing complex ideas with clarity and precision.',vi:'Sự hùng hồn trong văn học thuật có nghĩa là diễn đạt các ý tưởng phức tạp với sự rõ ràng và chính xác.'}]},
  antithesis: { word:'antithesis', meaning:'phản đề / đối lập hoàn toàn', emoji:'⚡', class:'n', examples:[
    {en:'The candidate presented his vision as the antithesis of the incumbent\'s failed policies.',vi:'Ứng viên trình bày tầm nhìn của mình là phản đề của các chính sách thất bại của đương nhiệm.'},
    {en:'In rhetoric, antithesis juxtaposes contrasting ideas to create emphasis and clarity.',vi:'Trong hùng biện, phản đề đặt cạnh các ý tưởng tương phản để tạo sự nhấn mạnh và rõ ràng.'}]},
  ethos: { word:'ethos', meaning:'uy tín đạo đức / tính cách', emoji:'🎖️', class:'n', examples:[
    {en:'Aristotle identified ethos, logos and pathos as the three modes of persuasion.',vi:'Aristotle xác định ethos, logos và pathos là ba phương thức thuyết phục.'},
    {en:'A speaker\'s ethos depends on the audience\'s perception of their character and credibility.',vi:'Uy tín đạo đức của người nói phụ thuộc vào nhận thức của khán giả về tính cách và độ đáng tin cậy của họ.'}]},
  deliberation_rhet: { word:'deliberation', meaning:'sự cân nhắc / thảo luận có chủ ý', emoji:'🤔', class:'n', examples:[
    {en:'Democratic deliberation involves open exchange of arguments before reaching a collective decision.',vi:'Thảo luận dân chủ liên quan đến trao đổi lập luận công khai trước khi đưa ra quyết định tập thể.'},
    {en:'Deliberation in a debate requires listening carefully to opposing views before responding.',vi:'Cân nhắc trong tranh luận đòi hỏi lắng nghe cẩn thận các quan điểm đối lập trước khi phản hồi.'}]},
  logos: { word:'logos', meaning:'lập luận lý trí (hùng biện)', emoji:'🧮', class:'n', examples:[
    {en:'Logos appeals to the audience\'s reason through facts, data and logical structure.',vi:'Logos thu hút lý trí của khán giả thông qua sự kiện, dữ liệu và cấu trúc logic.'},
    {en:'A well-constructed argument balances logos with ethos and pathos for maximum persuasion.',vi:'Một lập luận được xây dựng tốt cân bằng logos với ethos và pathos để thuyết phục tối đa.'}]},
  pathos: { word:'pathos', meaning:'kêu gọi cảm xúc (hùng biện)', emoji:'❤️', class:'n', examples:[
    {en:'Pathos invokes the audience\'s emotions to create empathy and drive action.',vi:'Pathos kêu gọi cảm xúc của khán giả để tạo sự đồng cảm và thúc đẩy hành động.'},
    {en:'Overuse of pathos without logos can undermine the credibility of an argument.',vi:'Sử dụng pathos quá mức mà không có logos có thể làm suy yếu tính đáng tin cậy của lập luận.'}]},
  // global-governance
  supranational: { word:'supranational', meaning:'siêu quốc gia', emoji:'🌐', class:'adj', examples:[
    {en:'The European Union is the most advanced example of a supranational political organisation.',vi:'Liên minh châu Âu là ví dụ tiên tiến nhất về một tổ chức chính trị siêu quốc gia.'},
    {en:'Critics of supranational governance argue that it erodes national sovereignty.',vi:'Những người chỉ trích quản trị siêu quốc gia cho rằng nó làm xói mòn chủ quyền quốc gia.'}]},
  self_determination: { word:'self-determination', meaning:'quyền tự quyết', emoji:'🕊️', class:'n', examples:[
    {en:'The principle of self-determination holds that peoples have the right to choose their own government.',vi:'Nguyên tắc quyền tự quyết khẳng định rằng các dân tộc có quyền lựa chọn chính phủ của họ.'},
    {en:'Self-determination movements have reshaped borders and political identities throughout modern history.',vi:'Các phong trào quyền tự quyết đã định hình lại biên giới và bản sắc chính trị trong suốt lịch sử hiện đại.'}]},
  harmonization: { word:'harmonization', meaning:'hài hòa hóa / đồng bộ hóa', emoji:'🔄', class:'n', examples:[
    {en:'Regulatory harmonization between trading partners reduces barriers and compliance costs.',vi:'Hài hòa hóa quy định giữa các đối tác thương mại giảm thiểu rào cản và chi phí tuân thủ.'},
    {en:'International harmonization of environmental standards is essential for effective global governance.',vi:'Hài hòa hóa quốc tế về các tiêu chuẩn môi trường là điều cần thiết cho quản trị toàn cầu hiệu quả.'}]},
  secretariat: { word:'secretariat', meaning:'ban thư ký / cơ quan thư ký', emoji:'🏢', class:'n', examples:[
    {en:'The UN Secretariat is responsible for the day-to-day administration of the organisation.',vi:'Ban Thư ký Liên Hợp Quốc chịu trách nhiệm quản lý hàng ngày của tổ chức.'},
    {en:'A permanent secretariat ensures continuity in intergovernmental organisations between meetings.',vi:'Ban thư ký thường trực đảm bảo tính liên tục trong các tổ chức liên chính phủ giữa các kỳ họp.'}]},
  embargo: { word:'embargo', meaning:'lệnh cấm vận', emoji:'🚫', class:'n', examples:[
    {en:'The trade embargo was imposed to pressure the government into changing its policies.',vi:'Lệnh cấm vận thương mại được áp đặt để gây áp lực buộc chính phủ thay đổi chính sách.'},
    {en:'Arms embargoes are used by the international community to limit conflict escalation.',vi:'Lệnh cấm vận vũ khí được cộng đồng quốc tế sử dụng để hạn chế leo thang xung đột.'}]},
  mediation: { word:'mediation', meaning:'hòa giải', emoji:'🤝', class:'n', examples:[
    {en:'International mediation helped bring the two sides to the negotiating table.',vi:'Hòa giải quốc tế đã giúp đưa hai bên đến bàn đàm phán.'},
    {en:'Mediation is often preferred over litigation as a faster and less adversarial dispute resolution method.',vi:'Hòa giải thường được ưa chuộng hơn kiện tụng như một phương pháp giải quyết tranh chấp nhanh hơn và ít đối kháng hơn.'}]},
  collective_security: { word:'collective security', meaning:'an ninh tập thể', emoji:'🛡️', class:'n', examples:[
    {en:'NATO embodies the principle of collective security: an attack on one is an attack on all.',vi:'NATO thể hiện nguyên tắc an ninh tập thể: tấn công một là tấn công tất cả.'},
    {en:'Collective security arrangements require member states to subordinate national interests to shared obligations.',vi:'Các thỏa thuận an ninh tập thể yêu cầu các quốc gia thành viên đặt lợi ích quốc gia dưới các nghĩa vụ chung.'}]},
  extraterritorial: { word:'extraterritorial', meaning:'ngoài lãnh thổ / ngoại lãnh', emoji:'🗺️', class:'adj', examples:[
    {en:'Some laws have extraterritorial reach, applying to a country\'s citizens anywhere in the world.',vi:'Một số luật có phạm vi ngoài lãnh thổ, áp dụng cho công dân của một quốc gia ở bất kỳ đâu trên thế giới.'},
    {en:'Extraterritorial jurisdiction is a contentious issue in international law.',vi:'Quyền tài phán ngoài lãnh thổ là vấn đề gây tranh cãi trong luật quốc tế.'}]},
  // bioethics
  beneficence: { word:'beneficence', meaning:'nguyên tắc từ thiện / làm điều tốt', emoji:'❤️', class:'n', examples:[
    {en:'Beneficence is one of the four core principles of biomedical ethics, requiring practitioners to act in patients\' best interest.',vi:'Nguyên tắc từ thiện là một trong bốn nguyên tắc cốt lõi của đạo đức sinh y, đòi hỏi người thực hành hành động vì lợi ích tốt nhất của bệnh nhân.'},
    {en:'Tension between beneficence and patient autonomy arises when patients refuse recommended treatment.',vi:'Sự căng thẳng giữa nguyên tắc từ thiện và quyền tự chủ của bệnh nhân nảy sinh khi bệnh nhân từ chối điều trị được khuyến nghị.'}]},
  permissibility: { word:'permissibility', meaning:'tính cho phép / sự chấp nhận được', emoji:'✅', class:'n', examples:[
    {en:'The permissibility of genetic enhancement is one of the most contested questions in bioethics.',vi:'Tính cho phép của cải thiện di truyền là một trong những câu hỏi gây tranh cãi nhất trong đạo đức sinh học.'},
    {en:'Scholars debate the permissibility of using embryos for research beyond a certain developmental stage.',vi:'Các học giả tranh luận về tính chấp nhận được của việc sử dụng phôi thai cho nghiên cứu vượt quá một giai đoạn phát triển nhất định.'}]},
  biosafety: { word:'biosafety', meaning:'an toàn sinh học', emoji:'🧬', class:'n', examples:[
    {en:'Biosafety protocols are essential when working with infectious agents or genetically modified organisms.',vi:'Các quy trình an toàn sinh học là điều cần thiết khi làm việc với các tác nhân lây nhiễm hoặc sinh vật biến đổi gen.'},
    {en:'International biosafety standards seek to prevent accidental release of dangerous biological material.',vi:'Các tiêu chuẩn an toàn sinh học quốc tế nhằm ngăn chặn việc phóng thích ngẫu nhiên vật liệu sinh học nguy hiểm.'}]},
  cloning: { word:'cloning', meaning:'nhân bản', emoji:'🧬', class:'n', examples:[
    {en:'Therapeutic cloning aims to produce stem cells for medical treatment rather than to create new organisms.',vi:'Nhân bản trị liệu nhằm mục đích tạo ra tế bào gốc để điều trị y tế chứ không phải tạo ra sinh vật mới.'},
    {en:'The ethics of human cloning remain deeply divisive in both scientific and religious communities.',vi:'Đạo đức của nhân bản người vẫn còn gây chia rẽ sâu sắc trong cả cộng đồng khoa học và tôn giáo.'}]},
  transhumanism: { word:'transhumanism', meaning:'chủ nghĩa siêu nhân', emoji:'🤖', class:'n', examples:[
    {en:'Transhumanism advocates using technology to enhance human capacities beyond biological limits.',vi:'Chủ nghĩa siêu nhân ủng hộ việc sử dụng công nghệ để nâng cao năng lực con người vượt qua các giới hạn sinh học.'},
    {en:'Critics of transhumanism warn that enhancement could deepen inequality and alter what it means to be human.',vi:'Những người chỉ trích chủ nghĩa siêu nhân cảnh báo rằng cải tiến có thể làm sâu sắc thêm bất bình đẳng và thay đổi ý nghĩa của việc là người.'}]},
  // argumentation
  warrant: { word:'warrant', meaning:'cơ sở biện hộ / chứng cứ nền tảng', emoji:'🔎', class:'n', examples:[
    {en:'In Toulmin\'s model, a warrant links the evidence to the claim being made.',vi:'Trong mô hình của Toulmin, cơ sở biện hộ liên kết bằng chứng với khẳng định được đưa ra.'},
    {en:'A strong argument requires not just evidence but a clearly articulated warrant.',vi:'Một lập luận mạnh không chỉ cần bằng chứng mà còn cần cơ sở biện hộ được trình bày rõ ràng.'}]},
  deconstruct: { word:'deconstruct', meaning:'phân tích tháo gỡ / giải cấu trúc', emoji:'🔍', class:'v', examples:[
    {en:'To deconstruct an argument is to identify its underlying assumptions and potential weaknesses.',vi:'Phân tích tháo gỡ một lập luận là xác định các giả định ẩn chứa và các điểm yếu tiềm ẩn của nó.'},
    {en:'Deconstructing a text reveals how language shapes meaning and reflects power dynamics.',vi:'Giải cấu trúc một văn bản tiết lộ cách ngôn ngữ định hình ý nghĩa và phản ánh các quan hệ quyền lực.'}]},
  refutation: { word:'refutation', meaning:'sự bác bỏ', emoji:'❌', class:'n', examples:[
    {en:'A compelling refutation does more than deny a claim; it dismantles the logic behind it.',vi:'Sự bác bỏ thuyết phục không chỉ phủ nhận một khẳng định; nó phá vỡ logic đằng sau nó.'},
    {en:'Anticipating refutation in advance strengthens the overall structure of an argument.',vi:'Dự đoán trước sự bác bỏ giúp củng cố cấu trúc tổng thể của một lập luận.'}]},
  qualifier: { word:'qualifier', meaning:'từ giới hạn / hạn định từ', emoji:'🔵', class:'n', examples:[
    {en:'A qualifier such as "usually" or "in most cases" signals that a claim has important exceptions.',vi:'Một từ giới hạn như "thường" hoặc "trong hầu hết các trường hợp" báo hiệu rằng một khẳng định có những ngoại lệ quan trọng.'},
    {en:'Using appropriate qualifiers demonstrates intellectual honesty and strengthens academic credibility.',vi:'Sử dụng các từ giới hạn phù hợp thể hiện sự trung thực trí tuệ và tăng cường uy tín học thuật.'}]},
  // globalisation
  convergence: { word:'convergence', meaning:'sự hội tụ', emoji:'🔀', class:'n', examples:[
    {en:'Economic convergence describes the tendency for poorer economies to grow faster than richer ones.',vi:'Hội tụ kinh tế mô tả xu hướng các nền kinh tế nghèo hơn tăng trưởng nhanh hơn các nền kinh tế giàu hơn.'},
    {en:'Cultural convergence through globalisation has both homogenised and enriched local traditions.',vi:'Hội tụ văn hóa thông qua toàn cầu hóa vừa đồng nhất hóa vừa làm phong phú thêm các truyền thống địa phương.'}]},
  polarization: { word:'polarization', meaning:'phân cực', emoji:'⚡', class:'n', examples:[
    {en:'Social media has accelerated political polarization by reinforcing existing beliefs.',vi:'Mạng xã hội đã đẩy nhanh phân cực chính trị bằng cách củng cố các niềm tin hiện có.'},
    {en:'Economic polarization between skilled and unskilled workers has widened over recent decades.',vi:'Phân cực kinh tế giữa lao động có kỹ năng và không có kỹ năng đã mở rộng trong những thập kỷ gần đây.'}]},
  cultural_diffusion: { word:'cultural diffusion', meaning:'lan tỏa văn hóa', emoji:'🌍', class:'n', examples:[
    {en:'The Silk Road was a powerful channel for cultural diffusion between East and West.',vi:'Con đường Tơ lụa là kênh lan tỏa văn hóa mạnh mẽ giữa Đông và Tây.'},
    {en:'Digital technology has accelerated cultural diffusion to an unprecedented scale.',vi:'Công nghệ kỹ thuật số đã đẩy nhanh lan tỏa văn hóa đến quy mô chưa từng có.'}]},
  outsourcing: { word:'outsourcing', meaning:'thuê ngoài', emoji:'🔄', class:'n', examples:[
    {en:'Outsourcing manufacturing to lower-cost countries has reshaped global supply chains.',vi:'Thuê ngoài sản xuất đến các quốc gia có chi phí thấp hơn đã định hình lại chuỗi cung ứng toàn cầu.'},
    {en:'Critics argue that outsourcing can undermine domestic employment and weaken labour standards.',vi:'Các nhà phê bình cho rằng thuê ngoài có thể làm suy yếu việc làm trong nước và làm yếu các tiêu chuẩn lao động.'}]},
  free_trade: { word:'free trade', meaning:'tự do thương mại', emoji:'🤝', class:'n', examples:[
    {en:'Proponents of free trade argue it increases efficiency and lowers consumer prices.',vi:'Những người ủng hộ tự do thương mại cho rằng nó tăng hiệu quả và giảm giá tiêu dùng.'},
    {en:'Free trade agreements often require countries to harmonise regulations and reduce tariff barriers.',vi:'Các hiệp định tự do thương mại thường yêu cầu các quốc gia hài hòa hóa quy định và giảm rào cản thuế quan.'}]},
  // social-change
  grassroots: { word:'grassroots', meaning:'cơ sở / từ cơ sở', emoji:'🌱', class:'adj', examples:[
    {en:'The grassroots movement grew from local communities before gaining national recognition.',vi:'Phong trào từ cơ sở phát triển từ các cộng đồng địa phương trước khi được công nhận ở cấp quốc gia.'},
    {en:'Grassroots activism has historically been a powerful force for social and political change.',vi:'Hoạt động từ cơ sở từ trước đến nay là lực lượng mạnh mẽ cho sự thay đổi xã hội và chính trị.'}]},
  civil_disobedience: { word:'civil disobedience', meaning:'bất tuân dân sự', emoji:'✊', class:'n', examples:[
    {en:'Gandhi championed civil disobedience as a nonviolent strategy to resist colonial rule.',vi:'Gandhi ủng hộ bất tuân dân sự như chiến lược bất bạo động để kháng cự chế độ thực dân.'},
    {en:'Civil disobedience involves deliberately breaking an unjust law to highlight its immorality.',vi:'Bất tuân dân sự liên quan đến việc cố ý vi phạm một luật bất công để làm nổi bật tính vô đạo đức của nó.'}]},
  // immigration-identity
  xenophobia: { word:'xenophobia', meaning:'bài ngoại / kỳ thị người nước ngoài', emoji:'🚫', class:'n', examples:[
    {en:'Rising xenophobia in several countries has made the integration of immigrants more difficult.',vi:'Bài ngoại gia tăng ở một số quốc gia đã làm cho việc hội nhập của người nhập cư khó khăn hơn.'},
    {en:'Xenophobia often intensifies during periods of economic insecurity and rapid demographic change.',vi:'Bài ngoại thường trở nên mạnh mẽ hơn trong các giai đoạn bất an kinh tế và thay đổi nhân khẩu học nhanh chóng.'}]},
  naturalization: { word:'naturalization', meaning:'nhập quốc tịch', emoji:'📋', class:'n', examples:[
    {en:'Naturalization grants immigrants the full rights and responsibilities of citizens.',vi:'Nhập quốc tịch trao cho người nhập cư đầy đủ quyền và trách nhiệm của công dân.'},
    {en:'The naturalization process typically requires language proficiency and a period of residency.',vi:'Quá trình nhập quốc tịch thường đòi hỏi năng lực ngôn ngữ và một thời gian cư trú.'}]},
  // psychology-society
  heuristic: { word:'heuristic', meaning:'phép tắc ngón tay cái / lối tắt nhận thức', emoji:'🧠', class:'n', examples:[
    {en:'A heuristic is a mental shortcut that speeds up decision-making but can introduce systematic errors.',vi:'Lối tắt nhận thức là phím tắt tâm thần giúp tăng tốc ra quyết định nhưng có thể gây ra lỗi hệ thống.'},
    {en:'The availability heuristic causes people to overestimate the probability of events they can easily recall.',vi:'Lối tắt khả dụng khiến người ta đánh giá quá cao xác suất của các sự kiện họ có thể dễ dàng nhớ lại.'}]},
  scapegoating: { word:'scapegoating', meaning:'đổ lỗi / chọn người thế tội', emoji:'🐐', class:'n', examples:[
    {en:'Scapegoating directs public frustration towards a minority group rather than addressing root causes.',vi:'Đổ lỗi hướng sự thất vọng của công chúng về phía một nhóm thiểu số thay vì giải quyết nguyên nhân gốc rễ.'},
    {en:'Scapegoating is a recurring feature of political populism during economic downturns.',vi:'Đổ lỗi là đặc điểm lặp đi lặp lại của chủ nghĩa dân túy chính trị trong thời kỳ suy thoái kinh tế.'}]},
  cognitive_dissonance: { word:'cognitive dissonance', meaning:'bất hòa nhận thức', emoji:'🔄', class:'n', examples:[
    {en:'Cognitive dissonance arises when a person holds two contradictory beliefs simultaneously.',vi:'Bất hòa nhận thức nảy sinh khi một người đồng thời giữ hai niềm tin mâu thuẫn.'},
    {en:'People often resolve cognitive dissonance by changing their beliefs rather than their behaviour.',vi:'Mọi người thường giải quyết bất hòa nhận thức bằng cách thay đổi niềm tin hơn là hành vi của họ.'}]},
  // consumer-society
  disposability: { word:'disposability', meaning:'tính dùng xong bỏ / tâm lý vứt bỏ', emoji:'🗑️', class:'n', examples:[
    {en:'The disposability of modern consumer goods has created an environmental crisis of waste.',vi:'Tính dùng xong bỏ của hàng tiêu dùng hiện đại đã tạo ra khủng hoảng môi trường về rác thải.'},
    {en:'Disposability culture extends beyond products to how society treats workers and relationships.',vi:'Văn hóa dùng xong bỏ mở rộng ra ngoài sản phẩm sang cách xã hội đối xử với người lao động và các mối quan hệ.'}]},
  conspicuous_consumption: { word:'conspicuous consumption', meaning:'tiêu dùng phô trương', emoji:'💎', class:'n', examples:[
    {en:'Veblen coined the term conspicuous consumption to describe spending driven by status display.',vi:'Veblen đặt ra thuật ngữ tiêu dùng phô trương để mô tả chi tiêu được thúc đẩy bởi việc trưng bày địa vị.'},
    {en:'Conspicuous consumption is increasingly criticised as both ethically questionable and environmentally harmful.',vi:'Tiêu dùng phô trương ngày càng bị chỉ trích là vừa đáng ngờ về mặt đạo đức vừa gây hại cho môi trường.'}]},
  planned_obsolescence: { word:'planned obsolescence', meaning:'lỗi thời có kế hoạch', emoji:'📱', class:'n', examples:[
    {en:'Planned obsolescence is a business strategy that deliberately limits a product\'s lifespan to encourage repeat purchases.',vi:'Lỗi thời có kế hoạch là chiến lược kinh doanh cố tình giới hạn tuổi thọ sản phẩm để khuyến khích mua lại.'},
    {en:'Critics argue that planned obsolescence contributes to electronic waste and unsustainable consumption.',vi:'Các nhà phê bình cho rằng lỗi thời có kế hoạch góp phần vào rác thải điện tử và tiêu dùng không bền vững.'}]},
  overconsumption: { word:'overconsumption', meaning:'tiêu thụ quá mức', emoji:'🌍', class:'n', examples:[
    {en:'Overconsumption in wealthy nations places disproportionate pressure on global natural resources.',vi:'Tiêu thụ quá mức ở các quốc gia giàu có tạo ra áp lực không cân xứng lên tài nguyên thiên nhiên toàn cầu.'},
    {en:'Addressing overconsumption requires both individual behaviour change and systemic policy reform.',vi:'Giải quyết tiêu thụ quá mức đòi hỏi cả thay đổi hành vi cá nhân lẫn cải cách chính sách mang tính hệ thống.'}]},
  // language-power
  hegemony: { word:'hegemony', meaning:'quyền bá chủ / thống trị văn hóa', emoji:'👑', class:'n', examples:[
    {en:'Gramsci used the concept of cultural hegemony to explain how dominant groups maintain power through consent.',vi:'Gramsci sử dụng khái niệm bá quyền văn hóa để giải thích cách các nhóm thống trị duy trì quyền lực thông qua sự đồng thuận.'},
    {en:'Linguistic hegemony occurs when one language marginalises others in political and cultural life.',vi:'Bá quyền ngôn ngữ xảy ra khi một ngôn ngữ làm bên lề hóa các ngôn ngữ khác trong đời sống chính trị và văn hóa.'}]},
  subtext: { word:'subtext', meaning:'ẩn ý / nghĩa ngầm', emoji:'💭', class:'n', examples:[
    {en:'The speech was polite on the surface, but its subtext was a clear threat to political opponents.',vi:'Bài phát biểu lịch sự trên bề mặt, nhưng ẩn ý của nó là một mối đe dọa rõ ràng với các đối thủ chính trị.'},
    {en:'Reading the subtext of political language reveals underlying assumptions about power and identity.',vi:'Đọc ẩn ý của ngôn ngữ chính trị tiết lộ các giả định ẩn chứa về quyền lực và bản sắc.'}]},
  legitimize: { word:'legitimize', meaning:'hợp thức hóa', emoji:'✅', class:'v', examples:[
    {en:'Language can be used to legitimize inequality by framing it as natural or inevitable.',vi:'Ngôn ngữ có thể được sử dụng để hợp thức hóa sự bất bình đẳng bằng cách mô tả nó là tự nhiên hoặc không thể tránh khỏi.'},
    {en:'Elections legitimize governments by demonstrating popular consent for their authority.',vi:'Bầu cử hợp thức hóa các chính phủ bằng cách chứng minh sự đồng thuận của dân chúng với quyền lực của họ.'}]},
  suppression: { word:'suppression', meaning:'đàn áp / triệt tiêu', emoji:'🔇', class:'n', examples:[
    {en:'The suppression of dissent is a common tactic among authoritarian regimes.',vi:'Đàn áp bất đồng là chiến thuật phổ biến trong các chế độ độc tài.'},
    {en:'Linguistic suppression of minority languages has historically accompanied political domination.',vi:'Triệt tiêu ngôn ngữ của các dân tộc thiểu số theo lịch sử đã đi kèm với sự thống trị chính trị.'}]},
  indoctrination: { word:'indoctrination', meaning:'nhồi nhét tư tưởng', emoji:'📢', class:'n', examples:[
    {en:'Indoctrination imposes a single belief system without encouraging critical inquiry.',vi:'Nhồi nhét tư tưởng áp đặt một hệ thống niềm tin duy nhất mà không khuyến khích tư duy phản biện.'},
    {en:'Critics accused the curriculum of indoctrination rather than genuine education.',vi:'Các nhà phê bình cáo buộc chương trình giảng dạy là nhồi nhét tư tưởng hơn là giáo dục thực sự.'}]},
  appropriation: { word:'appropriation', meaning:'chiếm dụng văn hóa', emoji:'🎭', class:'n', examples:[
    {en:'Cultural appropriation occurs when elements of a minority culture are adopted without acknowledgement or respect.',vi:'Chiếm dụng văn hóa xảy ra khi các yếu tố của một nền văn hóa thiểu số được tiếp nhận mà không có sự thừa nhận hoặc tôn trọng.'},
    {en:'The debate over cultural appropriation raises questions about power, representation and ownership.',vi:'Cuộc tranh luận về chiếm dụng văn hóa đặt ra câu hỏi về quyền lực, đại diện và quyền sở hữu.'}]},
  linguistic_relativity: { word:'linguistic relativity', meaning:'thuyết tương đối ngôn ngữ', emoji:'🌐', class:'n', examples:[
    {en:'Linguistic relativity proposes that the language we speak shapes how we perceive reality.',vi:'Thuyết tương đối ngôn ngữ đề xuất rằng ngôn ngữ chúng ta nói định hình cách chúng ta nhận thức thực tại.'},
    {en:'Research on linguistic relativity examines whether different languages produce different cognitive patterns.',vi:'Nghiên cứu về thuyết tương đối ngôn ngữ xem xét liệu các ngôn ngữ khác nhau có tạo ra các mô hình nhận thức khác nhau hay không.'}]},
  doublespeak: { word:'doublespeak', meaning:'lối nói mơ hồ / ngôn ngữ che giấu sự thật', emoji:'🗣️', class:'n', examples:[
    {en:'Doublespeak uses euphemisms and vague language to obscure unpleasant truths.',vi:'Lối nói mơ hồ sử dụng uyển ngữ và ngôn ngữ mơ hồ để che giấu những sự thật khó chịu.'},
    {en:'Orwell warned that political doublespeak could corrupt public discourse and erode democratic accountability.',vi:'Orwell cảnh báo rằng lối nói mơ hồ chính trị có thể làm hỏng diễn ngôn công cộng và xói mòn trách nhiệm dân chủ.'}]},
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function getTopic(id) {
  const t = master.topics.find(x => x.id === id);
  if (!t) throw new Error(`Topic "${id}" not found in master`);
  return t;
}

function replaceWord(topic, oldWord, newWordObj) {
  const idx = topic.words.findIndex(w => w.word.toLowerCase() === oldWord.toLowerCase());
  if (idx === -1) throw new Error(`"${oldWord}" not found in ${topic.id}`);
  topic.words[idx] = newWordObj;
  console.log(`  [${topic.id}] "${oldWord}" → "${newWordObj.word}"`);
}

function addWord(topic, newWordObj) {
  topic.words.push(newWordObj);
  console.log(`  [${topic.id}] + "${newWordObj.word}"`);
}

// ─── Apply changes ────────────────────────────────────────────────────────────

console.log('\n=== Phase 2: Master word changes ===\n');

// academic-skills [14→14]: REPLACE argument → reasoning
replaceWord(getTopic('academic-skills'), 'argument', W.reasoning);

// law-justice [14→14]: REPLACE amendment → indictment, jurisdiction → extradition
replaceWord(getTopic('law-justice'), 'amendment', W.indictment);
replaceWord(getTopic('law-justice'), 'jurisdiction', W.extradition);

// education-system [13→14]: ADD differentiation
addWord(getTopic('education-system'), W.differentiation);

// food-agriculture [13→14]: ADD food security
addWord(getTopic('food-agriculture'), W.food_security);

// language-communication [13→14]: ADD register
addWord(getTopic('language-communication'), W.register);

// philosophy-ethics [13→14]: REPLACE premise → axiom, integrity → deontology; ADD epistemology
replaceWord(getTopic('philosophy-ethics'), 'premise', W.axiom);
replaceWord(getTopic('philosophy-ethics'), 'integrity', W.deontology);
addWord(getTopic('philosophy-ethics'), W.epistemology);

// constitutional-law [13→14]: REPLACE accountability → impeachment; ADD habeas corpus
replaceWord(getTopic('constitutional-law'), 'accountability', W.impeachment);
addWord(getTopic('constitutional-law'), W.habeas_corpus);

// environmental-governance [13→14]: REPLACE compliance → stewardship, legislation → directive; ADD decarbonize
replaceWord(getTopic('environmental-governance'), 'compliance', W.stewardship);
replaceWord(getTopic('environmental-governance'), 'legislation', W.directive);
addWord(getTopic('environmental-governance'), W.decarbonize);

// political-philosophy [11→13]: REPLACE reform → constitutionalism, power → coercion; ADD federalism, social contract
replaceWord(getTopic('political-philosophy'), 'reform', W.constitutionalism);
replaceWord(getTopic('political-philosophy'), 'power', W.coercion);
addWord(getTopic('political-philosophy'), W.federalism);
addWord(getTopic('political-philosophy'), W.social_contract);

// public-policy [11→13]: REPLACE transparency → oversight, stakeholder → constituency; ADD lobbying, mandate
replaceWord(getTopic('public-policy'), 'transparency', W.oversight);
replaceWord(getTopic('public-policy'), 'stakeholder', W.constituency);
addWord(getTopic('public-policy'), W.lobbying);
addWord(getTopic('public-policy'), W.mandate);

// academic-discourse [11→13]: REPLACE thesis→proposition, peer review→dissemination, citation→attribution,
//                              methodology→framework, evaluate→annotate; ADD interdisciplinary, academic rigor
replaceWord(getTopic('academic-discourse'), 'thesis', W.proposition);
replaceWord(getTopic('academic-discourse'), 'peer review', W.dissemination);
replaceWord(getTopic('academic-discourse'), 'citation', W.attribution);
replaceWord(getTopic('academic-discourse'), 'methodology', W.framework);
replaceWord(getTopic('academic-discourse'), 'evaluate', W.annotate);
addWord(getTopic('academic-discourse'), W.interdisciplinary);
addWord(getTopic('academic-discourse'), W.academic_rigor);

// geopolitics [11→13]: ADD deterrence, sphere of influence
addWord(getTopic('geopolitics'), W.deterrence_geo);
addWord(getTopic('geopolitics'), W.sphere_of_influence);

// macroeconomics [11→13]: REPLACE inequality → stagflation; ADD quantitative easing, trade surplus
replaceWord(getTopic('macroeconomics'), 'inequality', W.stagflation);
addWord(getTopic('macroeconomics'), W.quantitative_easing);
addWord(getTopic('macroeconomics'), W.trade_surplus);

// medical-ethics [11→13]: REPLACE transparency → disclosure; ADD malpractice, placebo
replaceWord(getTopic('medical-ethics'), 'transparency', W.disclosure);
addWord(getTopic('medical-ethics'), W.malpractice);
addWord(getTopic('medical-ethics'), W.placebo);

// sociology [11→13]: REPLACE stereotype → stigma; ADD stratification, intersectionality
replaceWord(getTopic('sociology'), 'stereotype', W.stigma);
addWord(getTopic('sociology'), W.stratification);
addWord(getTopic('sociology'), W.intersectionality);

// business-ethics [11→13]: ADD due diligence, fiduciary
addWord(getTopic('business-ethics'), W.due_diligence);
addWord(getTopic('business-ethics'), W.fiduciary);

// technology-ethics [11→13]: REPLACE disruption → obsolescence, data → metadata, regulation → liability;
//                             ADD deepfake, explainability
replaceWord(getTopic('technology-ethics'), 'disruption', W.obsolescence);
replaceWord(getTopic('technology-ethics'), 'data', W.metadata);
replaceWord(getTopic('technology-ethics'), 'regulation', W.liability);
addWord(getTopic('technology-ethics'), W.deepfake);
addWord(getTopic('technology-ethics'), W.explainability);

// media-literacy [13→14]: ADD disinformation
addWord(getTopic('media-literacy'), W.disinformation);

// rhetoric-debate [11→13]: REPLACE fallacy → sophistry, coherence → eloquence,
//                           counterargument → antithesis, premise → syllogism,
//                           credibility → ethos, discourse → deliberation; ADD logos, pathos
replaceWord(getTopic('rhetoric-debate'), 'fallacy', W.sophistry);
replaceWord(getTopic('rhetoric-debate'), 'coherence', W.eloquence);
replaceWord(getTopic('rhetoric-debate'), 'counterargument', W.antithesis);
replaceWord(getTopic('rhetoric-debate'), 'premise', W.syllogism);
replaceWord(getTopic('rhetoric-debate'), 'credibility', W.ethos);
replaceWord(getTopic('rhetoric-debate'), 'discourse', W.deliberation_rhet);
addWord(getTopic('rhetoric-debate'), W.logos);
addWord(getTopic('rhetoric-debate'), W.pathos);

// global-governance [11→13]: REPLACE multilateral → supranational, sovereignty → self-determination,
//                             compliance → harmonization, institution → secretariat,
//                             sanction → embargo, diplomacy → mediation; ADD collective security, extraterritorial
replaceWord(getTopic('global-governance'), 'multilateral', W.supranational);
replaceWord(getTopic('global-governance'), 'sovereignty', W.self_determination);
replaceWord(getTopic('global-governance'), 'compliance', W.harmonization);
replaceWord(getTopic('global-governance'), 'institution', W.secretariat);
replaceWord(getTopic('global-governance'), 'sanction', W.embargo);
replaceWord(getTopic('global-governance'), 'diplomacy', W.mediation);
addWord(getTopic('global-governance'), W.collective_security);
addWord(getTopic('global-governance'), W.extraterritorial);

// bioethics [11→13]: REPLACE autonomy → beneficence, regulation → permissibility,
//                    research ethics → biosafety; ADD cloning, transhumanism
replaceWord(getTopic('bioethics'), 'autonomy', W.beneficence);
replaceWord(getTopic('bioethics'), 'regulation', W.permissibility);
replaceWord(getTopic('bioethics'), 'research ethics', W.biosafety);
addWord(getTopic('bioethics'), W.cloning);
addWord(getTopic('bioethics'), W.transhumanism);

// argumentation [12→13]: REPLACE evaluate → deconstruct, evidence → warrant, critique → refutation;
//                         ADD qualifier
replaceWord(getTopic('argumentation'), 'evaluate', W.deconstruct);
replaceWord(getTopic('argumentation'), 'evidence', W.warrant);
replaceWord(getTopic('argumentation'), 'critique', W.refutation);
addWord(getTopic('argumentation'), W.qualifier);

// globalisation [11→13]: REPLACE integration → convergence, inequality → polarization,
//                         influence → cultural diffusion; ADD outsourcing, free trade
replaceWord(getTopic('globalisation'), 'integration', W.convergence);
replaceWord(getTopic('globalisation'), 'inequality', W.polarization);
replaceWord(getTopic('globalisation'), 'influence', W.cultural_diffusion);
addWord(getTopic('globalisation'), W.outsourcing);
addWord(getTopic('globalisation'), W.free_trade);

// social-change [11→13]: ADD grassroots, civil disobedience
addWord(getTopic('social-change'), W.grassroots);
addWord(getTopic('social-change'), W.civil_disobedience);

// immigration-identity [11→13]: ADD xenophobia, naturalization
addWord(getTopic('immigration-identity'), W.xenophobia);
addWord(getTopic('immigration-identity'), W.naturalization);

// psychology-society [11→13]: REPLACE bias → heuristic; ADD scapegoating, cognitive dissonance
replaceWord(getTopic('psychology-society'), 'bias', W.heuristic);
addWord(getTopic('psychology-society'), W.scapegoating);
addWord(getTopic('psychology-society'), W.cognitive_dissonance);

// consumer-society [11→13]: REPLACE sustainability → disposability, inequality → conspicuous consumption;
//                            ADD planned obsolescence, overconsumption
replaceWord(getTopic('consumer-society'), 'sustainability', W.disposability);
replaceWord(getTopic('consumer-society'), 'inequality', W.conspicuous_consumption);
addWord(getTopic('consumer-society'), W.planned_obsolescence);
addWord(getTopic('consumer-society'), W.overconsumption);

// language-power [11→13]: REPLACE discourse → hegemony, narrative → subtext, framing → legitimize,
//                          censorship → suppression, propaganda → indoctrination,
//                          representation → appropriation; ADD linguistic relativity, doublespeak
replaceWord(getTopic('language-power'), 'discourse', W.hegemony);
replaceWord(getTopic('language-power'), 'narrative', W.subtext);
replaceWord(getTopic('language-power'), 'framing', W.legitimize);
replaceWord(getTopic('language-power'), 'censorship', W.suppression);
replaceWord(getTopic('language-power'), 'propaganda', W.indoctrination);
replaceWord(getTopic('language-power'), 'representation', W.appropriation);
addWord(getTopic('language-power'), W.linguistic_relativity);
addWord(getTopic('language-power'), W.doublespeak);

// ─── Verify ───────────────────────────────────────────────────────────────────

console.log('\n=== Verification ===\n');
const allWords = master.topics.flatMap(t => t.words.map(w => w.word.toLowerCase()));
const uniqueSet = new Set(allWords);
console.log(`Total words: ${allWords.length} (expected: 400)`);
console.log(`Unique words: ${uniqueSet.size} (expected: 400)`);

if (allWords.length !== 400 || uniqueSet.size !== 400) {
  const seen = {};
  allWords.forEach(w => { seen[w] = (seen[w] || 0) + 1; });
  const dups = Object.entries(seen).filter(([w, c]) => c > 1);
  if (dups.length) { console.log('Remaining dups (' + dups.length + '):', dups.map(([w,c])=>`"${w}"(${c}x)`).join(', ')); }
  const topics14 = master.topics.filter(t => t.words.length !== 13 && t.words.length !== 14);
  if (topics14.length) console.log('Unexpected word counts:', topics14.map(t=>`${t.id}[${t.words.length}]`).join(', '));
  process.exit(1);
}

console.log('\n✅ Master words: 400 total, 400 unique\n');

fs.writeFileSync(wordsPath, JSON.stringify(data, null, 2));
console.log('✅ data/words.json updated');
